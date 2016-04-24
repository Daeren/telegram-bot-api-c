//-----------------------------------------------------
//
// Author: Daeren
// Site: 666.io
//
//-----------------------------------------------------

"use strict";

//-----------------------------------------------------

const rHttps  = require("https");

const rErrors = require("./../errors");

//-----------------------------------------------------

const gKeepAliveAgent  = new rHttps.Agent({"keepAlive": true});

const gReqTimeout   = 1000 * 60 * 2,
      gReqOptions   = {
          "path":         null,
      
          "host":         "api.telegram.org",
          "port":         443,
      
          "method":       "POST",
      
          "agent":        gKeepAliveAgent
      };

//-----------------------------------------------------

module.exports = main;

//-----------------------------------------------------

function main(token, method, callback) {
    if(!token) {
        throw new Error("request: `token` was not specified");
    }

    if(!method) {
        throw new Error("request: `method` was not specified");
    }

    //------)>

    gReqOptions.path = "/bot" + token + "/" + method;

    //--------------]>

    return (callback ? rHttps.request(gReqOptions, onRequest).on("error", callback) : rHttps.request(gReqOptions)).setTimeout(gReqTimeout, onTimeout);

    //--------------]>

    function onTimeout() {
        const error = new Error("Timeout");
        error.code = rErrors.ERR_REQ_TIMEOUT;

        this.destroy(error);
    }

    function onRequest(response) {
        let firstChunk, chunks;

        //--------]>

        response
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
}