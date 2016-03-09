//-----------------------------------------------------
//
// Author: Daeren
// Site: 666.io
//
//-----------------------------------------------------

"use strict";

//-----------------------------------------------------

const rHttps = require("https");

//-----------------------------------------------------

const gKeepAliveAgent  = new rHttps.Agent({"keepAlive": true});

const gReqOptions   = {
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

    if(!callback) {
        throw new Error("request: `callback` was not specified");
    }

    //------)>

    gReqOptions.path = "/bot" + token + "/" + method;

    //--------------]>

    return rHttps.request(gReqOptions, cbRequest).on("error", callback);

    //--------------]>

    function cbRequest(response) {
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