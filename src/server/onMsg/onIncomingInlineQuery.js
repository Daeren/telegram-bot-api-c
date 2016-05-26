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

function main(ctx, plugins, events, updateType, eventType, input, callback) {
    const updateSubType     = null,
          eventSubType      = null;

    //------------]>

    ctx.updateType = updateType;
    ctx.updateSubType = updateSubType;

    ctx.eventType = eventType;
    ctx.eventSubType = eventSubType;

    ctx.from = input.from;

    ctx[eventType] = input;

    //---)>

    ctx.qid = input.id;

    //------------]>

    rRunAction(updateSubType, eventType, eventSubType, plugins, events, input, ctx, callback);
}