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
    ctx.sid = input.id;

    //------------]>

    rRunAction(ctx.updateSubType, eventType, ctx.eventSubType, plugins, events, input, ctx, callback);
}