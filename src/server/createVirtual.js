//-----------------------------------------------------
//
// Author: Daeren
// Site: 666.io
//
//-----------------------------------------------------

"use strict";

//-----------------------------------------------------

const rCreateBot    = require("./createBot"),
      rOnMsg        = require("./onMsg");

//-----------------------------------------------------

module.exports = main;

//-----------------------------------------------------

function main(botFather, callback) {
    const objBot = rCreateBot(botFather, callback);

    //----------------]>

    return (function() {
        const result = Object.create(objBot);

        result.input = input;
        result.middleware = middleware;

        return result;
    })();

    //----------------]>

    function input(error, data) {
        rOnMsg(error, objBot, data);
    }

    function middleware(request, response) {
        response.send("");
        input(null, request.body);
    }
}