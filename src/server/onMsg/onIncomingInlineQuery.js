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

function main(srvBot, updateType, eventType, input, callback) {
    const updateSubType     = null,
          eventSubType      = null;

    //------------]>

    rRunAction(updateSubType, eventType, eventSubType, srvBot.plugins, srvBot.events, input, createReqCtx(), callback);

    //------------]>

    function createReqCtx() {
        const ctx = Object.create(srvBot.ctx);

        //---------]>

        ctx.updateType = updateType;
        ctx.updateSubType = updateSubType;

        ctx.eventType = eventType;
        ctx.eventSubType = eventSubType;

        ctx.from = input.from;

        ctx[eventType] = input;

        //---)>

        ctx.qid = input.id;

        //---------]>

        return ctx;
    }
}