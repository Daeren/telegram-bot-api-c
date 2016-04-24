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

const rErrors           = require("./errors");

//-----------------------------------------------------

const gHttpKeepAliveAgent   = new rHttp.Agent({"keepAlive": true}),
      gHttpsKeepAliveAgent  = new rHttps.Agent({"keepAlive": true});

//-----------------------------------------------------

module.exports = {
    createReadStreamByUrl,
    getFilenameByMime,

    forEachAsync,
    executeGenerator
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

    const isHTTPS   = urlObj.protocol === "https:";
    const timeout   = 1000 * 60 * 2;

    const options   = {
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

    (isHTTPS ? rHttps : rHttp).get(options).on("error", callback).on("response", onResponse).setTimeout(timeout, onTimeout);

    //-----------]>

    function onTimeout() {
        const error = new Error("Timeout");
        error.code = rErrors.ERR_REQ_TIMEOUT;

        this.destroy(error);
    }

    function onResponse(response) {
        callback(null, response)
    }
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

function executeGenerator(generator, callback) {
    if(!generator || !generator[Symbol.iterator]) {
        return false;
    }

    callback = callback || pushException;

    //---------]>

    (function execute(input) {
        let next;

        try {
            next = generator.next(input);
        } catch(e) {
            callback(e);
            return;
        }

        if(!next.done) {
            next.value.then(execute, onGenError);
        }
        else {
            callback(null, next.value);
        }
    })();

    //---------]>

    return true;

    //---------]>

    function pushException(error) {
        if(error) {
            setImmediate(function() { throw error; });
        }
    }

    function onGenError(error) {
        try {
            generator.throw(error);
        } catch(e) {
            callback(e);
        }
    }
}