//-----------------------------------------------------
//
// Author: Daeren
// Site: 666.io
//
//-----------------------------------------------------

"use strict";

//-----------------------------------------------------

const rRunAction = require("./runAction");

//-----------------------------------------------------

module.exports = main;

//-----------------------------------------------------

function main(srvBot, input, callback) {
    rRunAction("inlineQuery", srvBot.plugins, srvBot.events, input, createReqCtx(), null, null, callback);

    //------------]>

    function createReqCtx() {
        const ctx           = Object.create(srvBot.ctx);

        //---------]>

        ctx.inlineQuery = input;
        ctx.from = input.from;

        ctx.qid = input.id;

        //---------]>

        return ctx;
    }
}