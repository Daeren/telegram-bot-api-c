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
        const ctx           = Object.create(srvBot.ctx);

        const message       = input.message;

        const msgChat       = message && message.chat;

        const isGroup       = !!(msgChat && (msgChat.type === "group" || msgChat.type === "supergroup")),
              isReply       = !!(message && message.reply_to_message);

        //---------]>

        ctx.updateType = updateType;
        ctx.updateSubType = updateSubType;

        ctx.eventType = eventType;
        ctx.eventSubType = eventSubType;

        ctx.from = input.from;

        ctx[eventType] = input;

        //---)>

        ctx.cqid = input.id;
        ctx.qid = input.inline_message_id;
        ctx.cid = msgChat && msgChat.id;
        ctx.mid = message && message.message_id;

        ctx.isGroup = isGroup;
        ctx.isReply = isReply;

        //---------]>

        return ctx;
    }
}