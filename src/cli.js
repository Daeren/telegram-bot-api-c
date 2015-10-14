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
    params = {};

//-----------------]>

process.argv.forEach(parseArgv);

//-----------------]>

rBot(token).call(method, params, function(error, result) {
    process.stdout.write(error || result);
});

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