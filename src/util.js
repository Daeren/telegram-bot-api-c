//-----------------------------------------------------
//
// Author: Daeren
// Site: 666.io
//
//-----------------------------------------------------

"use strict";

//-----------------------------------------------------

const rHttp             = require("http"),
      rHttps            = require("https"),
      rUrl              = require("url");

//-----------------------------------------------------

const gHttpKeepAliveAgent   = new rHttp.Agent({"keepAlive": true}),
      gHttpsKeepAliveAgent  = new rHttps.Agent({"keepAlive": true});

//-----------------------------------------------------

module.exports = {
    createReadStreamByUrl,
    getFilenameByMime,

    forEachAsync
};

//-----------------------------------------------------

function createReadStreamByUrl(url, callback) {
    const urlObj = rUrl.parse(url);

    //-------]>

    if(!urlObj.protocol || !(/^http/).test(urlObj.protocol)) {
        callback(new Error("Use the links only with HTTP/HTTPS protocol"));
        return;
    }

    //-------]>

    const isHTTPS = urlObj.protocol === "https:";
    const options = {
        "host":         urlObj.hostname,
        "port":         urlObj.port,
        "path":         urlObj.path,

        "agent":        isHTTPS ? gHttpsKeepAliveAgent : gHttpKeepAliveAgent,

        "headers":      {
            "User-Agent":   "TgBApic",
            "Referer":      url
        }
    };

    //-----------]>

    (isHTTPS ? rHttps : rHttp)
        .get(options)
        .on("error", callback)
        .on("response", response => callback(null, response));
}

function getFilenameByMime(contentType) {
    let result;

    if(contentType && typeof(contentType) === "string") {
        switch(contentType) {
            case "audio/mpeg":
            case "audio/MPA":
            case "audio/mpa-robust":
                result = "audio.mp3";

                break;

            default:
                result = contentType.replace("/", ".");
        }
    }

    return result || "";
}

//-------------[HELPERS]--------------}>

function forEachAsync(data, iter, cbEnd) {
    const len   = data.length;

    let i       = 0;

    //---------]>

    if(len) {
        run();
    }
    else {
        if(cbEnd) {
            cbEnd();
        }
    }

    //---------]>

    function run() {
        iter(cbNext, data[i], i);
    }

    function cbNext(error, result) {
        if(error) {
            if(cbEnd) {
                cbEnd(error, result, i);
            }

            return;
        }

        i++;

        if(i >= len) {
            if(cbEnd) {
                cbEnd(error, result, i);
            }
        } else {
            run();
        }
    }
}