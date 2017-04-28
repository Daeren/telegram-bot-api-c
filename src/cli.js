//-----------------------------------------------------
//
// Author: Daeren
// Site: 666.io
//
//-----------------------------------------------------

"use strict";

//-----------------------------------------------------

const rBot = require("./../index");

//-----------------------------------------------------

const gCRLF       = "\r\n",
      gReToken    = /^(\d+:\w+)/;

const gBufLineEnd = new Buffer(gCRLF);


const gToken     = process.env.TELEGRAM_BOT_TOKEN,
      gMethod    = process.env.TELEGRAM_BOT_METHOD;

//-----------------]>

let gOptions, gParams;

//-----------------------------------------------------

initBotCmd();

//-----------------]>

if(gOptions.size > 0 || gParams.size > 0) {
    callBotMethod(gOptions, gParams);
}
else {
    let chunks = [];

    //----)>

    const onEnd = function() {
        request();
    };

    const onReadable = function() {
        if(onReadable.lock) {
            return;
        }

        //-------]>

        let chunk = process.stdin.read();

        //-------]>

        if(!chunk || gBufLineEnd.equals(chunk)) {
            return;
        }

        //-------]>

        const idxLineEnd = chunk.indexOf(gBufLineEnd);

        //-------]>

        if(idxLineEnd >= 0) {
            onReadable.lock = true;
            chunks.push(chunk.slice(0, idxLineEnd));

            request(function() {
                onReadable.lock = false;
                onReadable();
            });

            chunk = chunk.slice(idxLineEnd + gBufLineEnd.length);
            chunks = [];

            if(chunk && chunk.length > 0) {
                process.stdin.unshift(chunk);
            }
        }
        else {
            chunks.push(chunk);
        }
    }

    //----------]>

    process.stdout
        .on("error", process.exit);

    process.stdin
        .on("readable", onReadable)
        .on("end", onEnd);

    //----------]>

    function request(callback) {
        if(!chunks.length) {
            return;
        }

        //------]>

        initBotCmd(null, objToMap(JSON.parse(Buffer.concat(chunks))));
        callBotMethod(gOptions, gParams, callback);
    }
}

//-----------------]>

function initBotCmd(data, params) {
    gOptions = new Map();
    gParams = params || parseArgv(data);

    moveObjField(gParams, gOptions, ["token", "method", "j"]);
}

//-----)>

function callBotMethod(options, params, callback) {
    const bot = rBot(options.get("token") || gToken)

    //-------]>

    bot.callJson(options.get("method") || gMethod, params, function(error, result) {
        if(result && !result.ok && result.parameters && result.parameters.retry_after) {
            setTimeout(function() {
                callBotMethod(options, params, callback);
            }, 1000 * result.parameters.retry_after);

            return;
        }

        if(callback) {
            setImmediate(callback);
        }

        if(error) {
            process.stderr.write(error.toString());
            process.stderr.write("\r\n");

            return;
        }

        result = JSON.stringify(result, null, options.get("j") ? "  " : null);

        process.stdout.write(result);
        process.stdout.write("\r\n");
    });
}

//-----------------------------------------------------

function parseArgv(data) {
    const result        = new Map();

    let nextOptIsVal    = false,
        curOptName      = "";

    //------]>

    (data || process.argv).forEach(explode);

    //------]>

    return result;

    //------]>

    function explode(value, index) {
        if(nextOptIsVal) {
            nextOptIsVal = false;

            result.set(curOptName, value);
        }
        else {
            let cmdName = value.match(/^--(\w+)/);

            if(cmdName) {
                nextOptIsVal = true;
                curOptName = cmdName[1];
            }
            else {
                cmdName = value.match(/^-(\w+)/);

                if(cmdName) {
                    result.set(cmdName[1], true);
                }
            }
        }
    }
}

function moveObjField(src, dest, field) {
    if(!src.size) {
        return;
    }

    if(Array.isArray(field)) {
        field.forEach(f => moveObjField(src, dest, f));
        return;
    }

    if(src.has(field)) {
        dest.set(field, src.get(field));
        src.delete(field);
    }
}

function objToMap(obj) {
    const result = new Map();

    for(let k of Object.keys(obj)) {
        result.set(k, obj[k]);
    }

    return result;
}