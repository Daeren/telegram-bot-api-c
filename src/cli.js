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

const gCRLF     = "\r\n",
      gReToken  = /^(\d+:\w+)/;


let gToken, gMethod, gParams;

//-----------------------------------------------------

process.argv.forEach(parseArgv);

//-----------------]>

if(!gParams) {
    const bufEnd = new Buffer(gCRLF);

    let chunks = [];

    //----)>

    const onEnd = function() {
        gParams = null;

        if(chunks.length) {
            gParams = Buffer.concat(chunks);
            gParams = JSON.parse(gParams);

            chunks = [];
        }

        call();
    };

    //----------]>

    process.stdin.on("data", function(chunk) {
        if(bufEnd.equals(chunk)) {
            onEnd();
        }
        else {
            chunks.push(chunk);
        }
    });

    process.stdin.on("end", onEnd);
} else {
    call();
}

//-----------------]>

function call() {
    rBot(gToken).call(gMethod, gParams, function(error, result) {
        if(error) {
            error = error.toString();
            process.stderr.write(error);

            return;
        }

        process.stdout.write(result);
    });
}

//-----------------------------------------------------

function parseArgv(value, index) {
    switch(index) {
        case 0:
        case 1:
            break;

        case 2:
            if(value.match(gReToken)) {
                gToken = value;
            }

            break;

        case 3:
            gMethod = value;
            break;

        default:
            gParams = gParams || {};

            //---------]>

            let name = value.match(/^--(\w+)=/);

            if(name) {
                name = name[1];

                value = value.match(new RegExp("^--" + name + "\\=([\\s\\S]+)"));

                if(value) {
                    gParams[name] = value[1];
                }

                break;
            }

            //-----)>

            name = value.match(/^-(\w+)/);

            if(name) {
                gParams[name[1]] = true;
            }
    }
}