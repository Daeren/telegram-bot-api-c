//-----------------------------------------------------
//
// Author: Daeren
// Site: 666.io
//
//-----------------------------------------------------

"use strict";

//-----------------------------------------------------

const rParseCmd         = require("./../parseCmd");

const rMsgSanitize      = require("./msgSanitize"),
      rResponseBuilder  = require("./responseBuilder");

//-----------------------------------------------------

const gReReplaceBotName = /^@\S+\s+/;

//-----------------------------------------------------

module.exports = main;

//-----------------------------------------------------

function main(objBot, data) {
    if(!data || typeof(data) !== "object") {
        return;
    }

    //--------]>

    const botPCurrent = objBot.bot;

    //--------]>

    if(botPCurrent.enabled("onMsg.sanitize") || botPCurrent.enabled("url.unsafe")) {
        data = rMsgSanitize(data); // <-- Prototype
    }

    //--------]>

    const msg = data.message;

    //--------]>

    if(!msg || typeof(msg) !== "object") {
        return;
    }

    //--------]>

    const msgChat           = msg.chat;

    const botPlugin         = objBot.plugin,
          botFilters        = objBot.filters,

          ctxBot            = createCtx(),

          msgType           = getTypeMsg(msg),
          evName            = getEventNameByTypeMsg(msgType);

    let cmdParam;

    //------------]>

    forEachAsync(botPlugin, onIterPlugin, onEndPlugin);

    //------------]>

    function onIterPlugin(next, plugin) {
        const plType        = plugin[0],
              plCallback    = plugin[1];

        let isEnd = false;

        //---------]>

        if(typeof(plType) !== "undefined") {
            if(evName !== plType) {
                onEnd();
            }
            else {
                if(plCallback.length < 2) {
                    onEnd(plCallback(ctxBot));
                }
                else {
                    plCallback(ctxBot, onEnd);
                }
            }

            return;
        }

        if(plCallback.length < 3) {
            onEnd(plCallback(evName, ctxBot));
        }  else {
            plCallback(evName, ctxBot, onEnd);
        }

        //---------]>

        function onEnd(state) {
            if(isEnd) {
                throw new Error("Plugin: double call `next`");
            }

            isEnd = true;

            setImmediate(next, state);
        }
    }

    function onEndPlugin(state) {
        switch(evName) {
            case "text":
                let rule, len;

                //-----[Filter: botName]----}>

                if(!msg.reply_to_message && msgChat.id < 0 && msgChat.type === "group") {
                    let msgText = msg.text;

                    if(msgText[0] === "@") {
                        msg.text = msgText.replace(gReReplaceBotName, "");
                    }
                }

                //-----[CMD]----}>

                cmdParam = rParseCmd(msg.text);

                if(cmdParam) {
                    rule = "/" + cmdParam.name;

                    if(callEvent(rule, cmdParam) || callEvent("/", cmdParam)) {
                        return;
                    }
                }

                //-----[RE]----}>

                len = botFilters.regexp.length;

                if(len) {
                    let reParams;

                    rule = undefined;

                    for(let re, i = 0; !rule && i < len; i++) {
                        re = botFilters.regexp[i];
                        reParams = msg.text.match(re.rule);

                        if(reParams) {
                            rule = re.rule;

                            if(rule && re.binds) {
                                let result  = {},
                                    binds   = re.binds;

                                for(let j = 0, jLen = Math.min(reParams.length - 1, binds.length); j < jLen; j++) {
                                    result[binds[j]] = reParams[j + 1];
                                }

                                reParams = result;
                            }
                        }
                    }

                    if(rule) {
                        botFilters.ev.emit(rule, ctxBot, reParams);
                        return;
                    }
                }

                break;
        }

        if(!evName || !callEvent(evName, msg[msgType]) && !callEvent("*", cmdParam)) {
            if(objBot.onMsg) {
                setImmediate(objBot.onMsg, ctxBot, cmdParam);
            }
        }

        //-------]>

        function callEvent(type, params) {
            if(state) {
                type += ":" + state;
            }

            if(botFilters.ev.listenerCount(type)) {
                botFilters.ev.emit(type, ctxBot, params);
                return true;
            }

            return false;
        }
    }

    //-------)>

    function createCtx() {
        let result = Object.create(objBot.ctx);

        result.isGroup = msgChat.type === "group";

        result.from = result.cid = msgChat.id;
        result.mid = msg.message_id;

        result.message = msg;
        result.data = createFResponseBuilder();

        result.createFResponseBuilder = createFResponseBuilder;

        //---------------]>

        return result;

        //---------------]>

        function createFResponseBuilder() {
            return function() { return new rResponseBuilder(result, botPCurrent); };
        }
    }
}

//----------------------------------------]>

function getEventNameByTypeMsg(type) {
    switch(type) {
        case "new_chat_participant":    return "enterChat";
        case "left_chat_participant":   return "leftChat";

        case "new_chat_title":          return "chatTitle";
        case "new_chat_photo":          return "chatNewPhoto";
        case "delete_chat_photo":       return "chatDeletePhoto";

        case "group_chat_created":      return "chatCreated";
        case "supergroup_chat_created": return "superChatCreated";
        case "channel_chat_created":    return "channelChatCreated";

        case "migrate_to_chat_id":      return "migrateToChatId";
        case "migrate_from_chat_id":    return "migrateFromChatId";
    }

    return type;
}

function getTypeMsg(m) {
    let t;

    if(
        objHasOwnProperty(m, t = "text") ||
        objHasOwnProperty(m, t = "photo") ||
        objHasOwnProperty(m, t = "audio") ||
        objHasOwnProperty(m, t = "document") ||
        objHasOwnProperty(m, t = "sticker") ||
        objHasOwnProperty(m, t = "video") ||
        objHasOwnProperty(m, t = "voice") ||
        objHasOwnProperty(m, t = "contact") ||
        objHasOwnProperty(m, t = "location") ||

        objHasOwnProperty(m, t = "new_chat_participant") ||
        objHasOwnProperty(m, t = "left_chat_participant") ||
        objHasOwnProperty(m, t = "new_chat_title") ||
        objHasOwnProperty(m, t = "new_chat_photo") ||
        objHasOwnProperty(m, t = "delete_chat_photo") ||
        objHasOwnProperty(m, t = "group_chat_created")
    ) {
        return t;
    }
}

//---------]>

function objHasOwnProperty(obj, prop) {
    return Object.prototype.hasOwnProperty.call(obj, prop);
}

function forEachAsync(data, iter, cbEnd) {
    let i   = 0,
        len = data.length;

    //---------]>

    if(len) {
        run();
    }
    else {
        if(cbEnd) {
            cbEnd();
        }
    }

    //---------]>

    function run() {
        iter(cbNext, data[i], i);
    }

    function cbNext(error, result) {
        if(error) {
            if(cbEnd) {
                cbEnd(error);
            }

            return;
        }

        i++;

        if(i >= len) {
            if(cbEnd) {
                cbEnd(error, result);
            }
        } else {
            run();
        }
    }
}