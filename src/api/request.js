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

    const req = rHttps.request(gReqOptions, cbRequest);

    if(typeof(callback) === "function") {
        req.on("error", callback);
    }

    //--------------]>

    return req;

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