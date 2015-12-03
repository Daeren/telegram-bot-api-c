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

const gTgHostApi    = "api.telegram.org";

const gReqOptions   = {
    "path":         null,
    "host":         gTgHostApi,
    "method":       "POST"
};

//-----------------------------------------------------

module.exports = main;

//-----------------------------------------------------

function main(token, method, callback) {
    if(!method) {
        throw new Error("request: `method` was not specified");
    }

    gReqOptions.path = "/bot" + token + "/" + method;

    //--------------]>

    return rHttps
        .request(gReqOptions, cbRequest)
        .on("error", callback);

    //--------------]>

    function cbRequest(response) {
        let firstChunk, chunks;

        //---------]>

        response.on("data", function(chunk) {
            if(!firstChunk) {
                firstChunk = chunk;
            }
            else {
                chunks = chunks || [firstChunk];
                chunks.push(chunk);
            }
        });

        response.on("end", function() {
            callback(null, chunks ? Buffer.concat(chunks) : firstChunk, response);
        });
    }
}