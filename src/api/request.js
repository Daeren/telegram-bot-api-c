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

const gKeepAliveAgentHTTP    = new rHttp.Agent({"keepAlive": true});
const gKeepAliveAgentHTTPS   = new rHttps.Agent({"keepAlive": true});

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

        const req = rHttp.request(gReqProxyTunOptions);

        //-------]>

        if(callback) {
            req.on("error", onError);
        }

        //-------]>

        req
            .on("connect", function(response, socket) {
                const statusCode = response.statusCode;

                if(statusCode === 200) {
                    gReqProxyOptions.path = path;
                    gReqProxyOptions.socket = socket;

                    onInit(buildRequest(gReqProxyOptions));
                }
                else {
                    const e = new Error("Proxy | connect.statusCode: " + statusCode);
                    e.code = rErrors.ERR_BAD_PROXY;

                    socket.destroy(e);
                }
            })
            .setTimeout(gReqTimeout, onTimeout)
            .end();
    }
    else {
        gReqOptions.path = path;

        onInit(buildRequest(gReqOptions));
    }

    //--------------]>

    function buildRequest(opt) {
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