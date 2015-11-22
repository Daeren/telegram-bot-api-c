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
      rFs           = require("fs");

const rCreateBot    = require("./createBot"),
      rOnMsg        = require("./onMsg");

//-----------------------------------------------------

module.exports = main;

//-----------------------------------------------------

function main(botFather, params, callback) {
    if(typeof(params) === "function") {
        callback = params;
        params = undefined;
    }

    params = params || {
        "host": "127.0.0.1",
        "http": true
    };

    params.port = params.port || 88;

    //-----------------]>

    const isHTTPS       = !params.http;
    const srvBotDefault = rCreateBot(botFather, callback);

    let srv, srvBots;

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

        //------)>

        const options = {
            "key":    optKey,
            "cert":   optCert,
            "ca":     optCa,

            "ciphers": [
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
            ].join(":"),

            "honorCipherOrder":     true,

            "requestCert":          true,
            "rejectUnauthorized":   false
        };

        //---------]>

        srv = rHttps.createServer(options, cbServer);
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

        let firstChunk, chunks;

        //----------]>

        req
            .on("data", onData)
            .on("end", onEnd);

        //----------]>

        function onData(chunk) {
            if(!firstChunk) {
                firstChunk = chunk;
            }
            else {
                chunks = chunks || [firstChunk];
                chunks.push(chunk);
            }
        }

        function onEnd() {
            response();

            //--------]>

            const objBot      = srvBots && srvBots[req.url] || srvBotDefault,
                  cbLogger    = objBot.cbLogger;

            let data    = chunks ? Buffer.concat(chunks) : firstChunk,
                error   = null;

            //--------]>

            try {
                data = JSON.parse(data);
            } catch(e) {
                error = e;
            }

            //--------]>

            if(cbLogger) {
                cbLogger(error, data);
            }

            if(error) {
                return;
            }

            //--------]>

            rOnMsg(objBot, data);
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

            if(evName === "STOP")
                process.exit();
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

    function addBot(bot, path, callback) {
        srvBots = srvBots || Object.create(null);

        if(srvBots[path]) {
            throw new Error("Path '" + path + "' has already been used");
        }

        //-------------]>

        const srvBot = srvBots[path] = rCreateBot(bot, callback);

        if(typeof(params.autoWebhook) === "undefined" || typeof(params.autoWebhook) === "string" && params.autoWebhook) {
            if(params.autoWebhook || params.host) {
                const url = (params.autoWebhook || (params.host + ":" + params.port)) + path;
                const data = {"url": url, "certificate": params.selfSigned};

                srvBot
                    .bot
                    .callJson("setWebhook", data, function(error, isOk) {
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
                    }
                );
            }
            else {
                console.log("[!] Warning | `autoWebhook` and `host` not specified, autoWebhook not working");
            }
        }

        //-------------]>

        return srvBot;
    }
}