//-----------------------------------------------------
//
// Author: Daeren
// Site: 666.io
//
//-----------------------------------------------------

"use strict";

//-----------------------------------------------------

const gErrors = {
    "ERR_INTERNAL_SERVER":      500,
    "ERR_NOT_FOUND":            400,
    "ERR_FORBIDDEN":            403,

    "ERR_MESSAGE_LIMITS":       429,
    "ERR_USED_WEBHOOK":         409,
    "ERR_INVALID_TOKEN":        401,

    "ERR_FAILED_PARSE_DATA":    -10000,
    "ERR_BAD_REQUEST":          -10001,
    "ERR_REQ_TIMEOUT":          -10002
};

//-----------------------------------------------------

module.exports = bind(function(v) {
    return bind(v);
});

//-----------------------------------------------------

function bind(v) {
    for(let name in gErrors) {
        if(gErrors.hasOwnProperty(name)) {
            v[name] = gErrors[name];
        }
    }

    return v;
}