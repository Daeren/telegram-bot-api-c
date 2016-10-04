//-----------------------------------------------------
//
// Author: Daeren
// Site: 666.io
//
//-----------------------------------------------------

"use strict";

//-----------------------------------------------------

const rHttp         = require("http"),
      rHttps        = require("https"),
      rCrypto       = require("crypto"),
      rFs           = require("fs");

const rCreateBot    = require("./createBot"),
      rOnMsg        = require("./onMsg");

const rErrors       = require("./../errors");

//-----------------------------------------------------

const gCiphers = [
    "ECDHE-RSA-AES256-SHA384",
    "DHE-RSA-AES256-SHA384",
    "ECDHE-RSA-AES256-SHA256",
    "DHE-RSA-AES256-SHA256",
    "ECDHE-RSA-AES128-SHA256",
    "DHE-RSA-AES128-SHA256",
    "HIGH",
    "!aNULL",
    "!eNULL",
    "!EXPORT",
    "!DES",
    "!RC4",
    "!MD5",
    "!PSK",
    "!SRP",
    "!CAMELLIA"
].join(":");

//-----------------------------------------------------

module.exports = main;

//-----------------------------------------------------

function main(botFather, params, callback) {
    if(typeof(params) === "function") {
        callback = params;
        params = undefined;
    }

    if(params) {
        params.port = params.port || 88;
    }
    else {
        params = {
            "host":         "localhost",
            "port":         1488,

            "autoWebhook":  false,
            "ssl":          false
        };
    }

    //-----------------]>

    const isHTTPS       = params.ssl !== false;

    const srvBotDefault = rCreateBot(botFather, callback),
          srvBots       = Object.create(null);

    let srv;

    //----------)>

    if(isHTTPS) {
        const certDir = params.certDir || "";

        const optKey  = rFs.readFileSync(certDir + params.key),
              optCert = rFs.readFileSync(certDir + params.cert);

        let optCa     = params.ca;

        //------)>

        if(optCa) {
            if(Array.isArray(optCa)) {
                optCa = optCa.map(function(e) {
                    return rFs.readFileSync(certDir + e);
                });
            }
            else if(typeof(optCa) === "string") {
                optCa = certDir + optCa;
            }
        }

        //---------]>

        srv = rHttps.createServer({
            "key":                  optKey,
            "cert":                 optCert,
            "ca":                   optCa,

            "ciphers":              gCiphers,

            "honorCipherOrder":     true,

            "requestCert":          true,
            "rejectUnauthorized":   false
        }, cbServer);
    }
    else {
        srv = rHttp.createServer(cbServer);
    }

    srv.listen(params.port, params.host, cbListen);

    //-----------------]>

    return (function() {
        const result = Object.create(srvBotDefault);

        result.app = srv;
        result.bot = addBot;

        return result;
    })();

    //-----------------]>

    function cbServer(req, res) {
        if(req.method !== "POST") {
            return response();
        }

        //----------]>

        let firstChunk, chunks;

        //----------]>

        req
            .on("data", onRequestData)
            .on("end", onRequestEnd);

        //----------]>

        function onRequestData(chunk) {
            if(!firstChunk) {
                firstChunk = chunk;
            }
            else {
                chunks = chunks || [firstChunk];
                chunks.push(chunk);
            }
        }

        function onRequestEnd() {
            response();

            //--------]>

            const srvBot    = srvBots && srvBots[req.url] || srvBotDefault;

            let data        = chunks ? Buffer.concat(chunks) : firstChunk,
                error       = null;

            //--------]>

            try {
                data = JSON.parse(data);
            } catch(e) {
                error = e;

                error.code = rErrors.ERR_FAILED_PARSE_DATA;
                error.data = data;

                data = null;
            }

            //--------]>

            rOnMsg(error, srvBot, data);
        }

        //-------)>

        function response(code) {
            res.writeHead(code || 200);
            res.end();
        }
    }

    function cbListen() {
        const host = srv.address().address,
              port = srv.address().port;

        //-------]>

        onAction(null, "START");

        //-------]>

        process.on("SIGINT", onAction);
        process.on("uncaughtException", onAction);

        //-------]>

        function onAction(error, evName) {
            evName = evName || "STOP";

            console.log("\n+---[%s]------------------------------------".slice(0, -1 * evName.length), evName);
            console.log("|");
            console.log("| Server: [%s]", getAddress());
            console.log("| Date: %s", getTime());
            console.log("+-----------------------------------------\n");

            if(error) {
                console.error(error.stack);
            }

            if(evName === "STOP") {
                process.exit();
            }
        }

        //---)>

        function getAddress() {
            return (params.http ? "http" : "https") + "://" + (host || "*") + ":" + port;
        }

        function getTime() {
            return new Date().toISOString().replace(/T/, " ").replace(/\..+/, "");
        }
    }

    //-----------------]>

    function addBot(bot, path, onMsg) {
        if(typeof(path) === "function") {
            onMsg = path;
            path = null;
        }

        if(!path) {
            if(!bot.token()) {
                throw new Error("`path` and `token` not specified.");
            }

            path = "/tg_bot_" + rCrypto.createHash("sha256").update(bot.token()).digest("hex");
        }

        //-------------]>

        if(params.autoWebhook !== false) {
            if(params.autoWebhook || params.host && params.port) {
                if(!bot.token()) {
                    throw new Error("`token` not specified.");
                }

                //---------]>

                const url   = (params.autoWebhook || (params.host + ":" + params.port)) + path;
                const data  = {
                    "url":          url,
                    "certificate":  params.selfSigned
                };

                //---------]>

                bot.api.setWebhook(data, function(error, isOk) {
                    if(isOk) {
                        return;
                    }

                    console.log("[-] Webhook: %s", url);

                    if(error) {
                        if(error.message) {
                            console.log(error.message);
                        }

                        console.log(error.stack);
                    }
                });
            }
            else {
                console.log("[!] Warning | `autoWebhook` and `host` not specified, webhook not working.");
            }
        }

        //-------------]>

        if(srvBots[path]) {
            throw new Error("Path '" + path + "' has already been used.");
        }

        //-------------]>

        return (srvBots[path] = rCreateBot(bot, onMsg));
    }
}