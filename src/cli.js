//-----------------------------------------------------
//
// Author: Daeren
// Site: 666.io
//
//-----------------------------------------------------

"use strict";

//-----------------------------------------------------

var rBot = require(__dirname + "/../index");

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
    if(!token && index <= 2) {
        val = val.match(reToken);

        if(val)
            token = val[0];

        return;
    }

    if(!method) {
        method = val;
        return;
    }

    if((/^--/).test(val)) {
        var name = val.match(/^--(\w+)=/);
        name = name && name[1];

        if(!name)
            return;

        val = val.match(new RegExp("^--" + name + "\\=([\\s\\S]+)"));
        val = val && val[1];

        params[name] = val;

        return;
    }

    if((/^-/).test(val)) {
        var name = val.match(/^-(\w+)/);
        name = name && name[1];

        if(!name)
            return;

        params[name] = true;
    }
}