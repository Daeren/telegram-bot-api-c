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

const gKeepAliveAgent   = new rHttps.Agent({"keepAlive": true});

const gReqTimeout       = 1000 * 60 * 2,
      gReqOptions       = {
          "path":   null,
          "method": "POST",

          "host":   "api.telegram.org",
          "port":   443,
      
          "agent":  gKeepAliveAgent
      };

//-----------------------------------------------------

module.exports = main;

//-----------------------------------------------------

function main(token, method, callback) {
    gReqOptions.path = "/bot" + token + "/" + method;

    //--------------]>

    return (callback ? rHttps.request(gReqOptions, onResponse).on("error", onError) : rHttps.request(gReqOptions)).setTimeout(gReqTimeout, onTimeout);

    //--------------]>

    function onError(error) {
        error.code = rErrors.ERR_BAD_REQUEST;
        callback(error, null, null);
    }

    function onTimeout() {
        this.destroy(new Error("Timeout."));
    }

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
}