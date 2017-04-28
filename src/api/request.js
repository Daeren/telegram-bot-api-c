//-----------------------------------------------------
//
// Author: Daeren
// Site: 666.io
//
//-----------------------------------------------------

"use strict";

//-----------------------------------------------------

const rHttp   = require("http"),
      rHttps  = require("https");

const rErrors = require("./../errors");

//-----------------------------------------------------

const gKeepAliveAgentHTTP    = new rHttp.Agent({"keepAlive": true}),
      gKeepAliveAgentHTTPS   = new rHttps.Agent({"keepAlive": true});

const gReqTimeout       = 1000 * 60 * 2,

      gReqOptions       = {
          "path":       null,
          "method":     "POST",

          "host":       "api.telegram.org",
          "port":       443,

          "agent":      gKeepAliveAgentHTTPS
      },

      gReqProxyTunOptions = {
          "host":     null,
          "port":     null,

          "method":   "CONNECT",
          "path":     "api.telegram.org:443",

          "agent":    gKeepAliveAgentHTTP
      },
      gReqProxyOptions  = {
          "path":       null,
          "method":     "POST",

          "host":       "api.telegram.org",
          "port":       443,

          "agent":      false
      };

//-----------------------------------------------------

module.exports = main;

//-----------------------------------------------------

function main(proxy, token, method, callback, onInit) {
    const path = "/bot" + token + "/" + method;

    //--------------]>

    if(proxy) {
        if(typeof(proxy) === "string") {
            proxy = proxy.split(":");
        }

        gReqProxyTunOptions.host = proxy.host || proxy[0];
        gReqProxyTunOptions.port = proxy.port || proxy[1];

        //-------]>

        buildTunRequest(gReqProxyTunOptions, function(response, socket) {
            const statusCode = response.statusCode;

            if(statusCode === 200) {
                gReqProxyOptions.path = path;
                gReqProxyOptions.socket = socket;

                onInit(buildHTTPSRequest(gReqProxyOptions));
            }
            else {
                const e = new Error("Proxy | connect.statusCode: " + statusCode);
                e.code = rErrors.ERR_BAD_PROXY;

                socket
                    .on("error", onError)
                    .destroy(e);
            }
        });
    }
    else {
        gReqOptions.path = path;

        onInit(buildHTTPSRequest(gReqOptions));
    }

    //--------------]>

    function buildTunRequest(opt, onConnect) {
        return (callback ? rHttp.request(opt).on("error", onError) : rHttp.request(opt)).on("connect", onConnect).setTimeout(gReqTimeout, onTimeout).end();
    }

    function buildHTTPSRequest(opt) {
        return (callback ? rHttps.request(opt, onResponse).on("error", onError) : rHttps.request(opt)).setTimeout(gReqTimeout, onTimeout);
    }

    //-------)>

    function onResponse(response) {
        let firstChunk, chunks;

        //--------]>

        response
            .on("error", onError)
            .on("data", onResponseData)
            .on("end", onResponseEnd);

        //--------]>

        function onResponseData(chunk) {
            if(!firstChunk) {
                firstChunk = chunk;
            }
            else {
                chunks = chunks || [firstChunk];
                chunks.push(chunk);
            }
        }

        function onResponseEnd() {
            callback(null, chunks ? Buffer.concat(chunks) : firstChunk, response);
        }
    }

    function onError(error) {
        if(error.code !== rErrors.ERR_BAD_PROXY) {
            error.code = rErrors.ERR_BAD_REQUEST;
        }

        callback(error, null, null);
    }

    function onTimeout() {
        this.destroy(new Error("Timeout."));
    }
}