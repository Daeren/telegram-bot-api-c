//-----------------------------------------------------
//
// Author: Daeren
// Site: 666.io
//
//-----------------------------------------------------

"use strict";

//-----------------------------------------------------

var rBot = require("./../index");

//-----------------------------------------------------

var reToken = /^(\d+:\w+)/;

var token,
    method,
    params;

//-----------------]>

process.argv.forEach(parseArgv);

if(!params) {
    var isEnded = false;

    var bufEnd = new Buffer("\r\n"),
        chunks = [];

    var onEnd = function() {
        params = Buffer.concat(chunks);
        params = JSON.parse(params);

        chunks = [];

        call();
    };

    //----------]>

    process.stdin.on("data", function(chunk) {
        if(bufEnd.equals(chunk))
            onEnd(); else chunks.push(chunk);
    });

    process.stdin.on("end", onEnd);
} else
    call();

//-----------------]>

function call() {
    rBot(token).call(method, params, function(error, result) {
        process.stdout.write(error || result);
    });
}

//-----------------------------------------------------

function parseArgv(val, index, array) {
    switch(index) {
        case 0:
        case 1:
            break;

        case 2:
            if(val.match(reToken))
                token = val;

            break;

        case 3:
            method = val;
            break;

        default:
            params = params || {};

            var name = val.match(/^--(\w+)=/);

            if(name) {
                name = name && name[1];

                val = val.match(new RegExp("^--" + name + "\\=([\\s\\S]+)"));
                val = val && val[1];

                params[name] = val;

                break;
            }

            name = val.match(/^-(\w+)/);

            if(name) {
                name = name && name[1];
                params[name] = true;
            }
    }
}