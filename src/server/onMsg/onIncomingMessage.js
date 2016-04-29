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

const gReReplaceBotName = /^@\w{5,32}\s+|^@\w{5,32}$/;

//-----------------------------------------------------

module.exports = main;

//-----------------------------------------------------

function main(srvBot, input, callback) {
    const msgType           = getMessageDataField(input),
          evName            = getEventNameByMsgField(msgType);

    const msgChat           = input.chat;

    const isGroup           = msgChat.type === "group" || msgChat.type === "supergroup",
          isReply           = !!(input.reply_to_message);

    const botInstance       = srvBot.instance;

    //-----[Filter: botName]----}>

    if(isGroup && !isReply && evName === "text" && input.text[0] === "@" && botInstance.disabled("onMsg.skipFilterBotName")) {
        input.text = input.text.replace(gReReplaceBotName, "");

        if(!input.text) {
            return;
        }
    }

    //------------]>

    rRunAction("message", srvBot.plugins, srvBot.events, input, createReqCtx(), evName, msgType, callback);

    //------------]>

    function createReqCtx() {
        const ctx = Object.create(srvBot.ctx);

        //---------]>

        ctx.message = input;
        ctx.from = input.from;

        ctx.cid = msgChat.id;
        ctx.mid = input.message_id;

        ctx.isGroup = isGroup;
        ctx.isReply = isReply;

        //---------]>

        return ctx;
    }
}

//---------]>

function getEventNameByMsgField(field) {
    /*jshint maxcomplexity:50 */

    switch(field) {
        case "new_chat_member":         return "enterChat";
        case "left_chat_member":        return "leftChat";

        case "new_chat_title":          return "chatTitle";
        case "new_chat_photo":          return "chatNewPhoto";
        case "delete_chat_photo":       return "chatDeletePhoto";

        case "group_chat_created":      return "chatCreated";
        case "supergroup_chat_created": return "superChatCreated";
        case "channel_chat_created":    return "channelChatCreated";

        case "migrate_to_chat_id":      return "migrateToChatId";
        case "migrate_from_chat_id":    return "migrateFromChatId";

        case "pinned_message":          return "pinnedMessage";

        default:                        return field;
    }
}

function getMessageDataField(m) {
    /*jshint maxcomplexity:50 */

    let t;

    if(
        hasOwnProperty.call(m, t = "text") ||
        hasOwnProperty.call(m, t = "photo") ||
        hasOwnProperty.call(m, t = "audio") ||
        hasOwnProperty.call(m, t = "document") ||
        hasOwnProperty.call(m, t = "sticker") ||
        hasOwnProperty.call(m, t = "video") ||
        hasOwnProperty.call(m, t = "voice") ||
        hasOwnProperty.call(m, t = "location") ||
        hasOwnProperty.call(m, t = "venue") ||
        hasOwnProperty.call(m, t = "contact") ||

        hasOwnProperty.call(m, t = "new_chat_member") ||
        hasOwnProperty.call(m, t = "left_chat_member") ||

        hasOwnProperty.call(m, t = "new_chat_title") ||
        hasOwnProperty.call(m, t = "new_chat_photo") ||
        hasOwnProperty.call(m, t = "delete_chat_photo") ||

        hasOwnProperty.call(m, t = "group_chat_created") ||
        hasOwnProperty.call(m, t = "supergroup_chat_created") ||
        hasOwnProperty.call(m, t = "channel_chat_created") ||

        hasOwnProperty.call(m, t = "migrate_to_chat_id") ||
        hasOwnProperty.call(m, t = "migrate_from_chat_id") ||

        hasOwnProperty.call(m, t = "pinned_message")
    ) {
        return t;
    }
}