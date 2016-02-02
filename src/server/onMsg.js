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

const C_BD_TYPE_UNKNOWN      = 0,
      C_BD_TYPE_MESSAGE      = 1,
      C_BD_TYPE_INLINE_QUERY = 2;

//-----------------------------------------------------

module.exports = main;

//-----------------------------------------------------

function main(srvBot, data) {
    if(!data || typeof(data) !== "object") {
        return;
    }

    //--------]>

    const botInstance = srvBot.instance;

    //--------]>

    if(botInstance.enabled("onMsg.sanitize")) {
        data = rMsgSanitize(data); // <-- Prototype
    }

    //--------]>

    const inlineQuery   = data.inline_query,
          msg           = data.message;

    const bdataType     =
                            inlineQuery && typeof(inlineQuery) === "object" ? C_BD_TYPE_INLINE_QUERY :
                            (msg && typeof(msg) === "object" ? C_BD_TYPE_MESSAGE : C_BD_TYPE_UNKNOWN);

    //--------]>

    let msgType             = null,
        evName              = null,
        cmdParam            = null;

    switch(bdataType) {
        case C_BD_TYPE_MESSAGE:
            msgType = getTypeMsg(msg);
            evName = getEventNameByTypeMsg(msgType);

            break;

        case C_BD_TYPE_INLINE_QUERY:
            evName = "inlineQuery";

            break;

        default:
            return;
    }

    //--------]>

    const msgChat           = msg ? msg.chat : null;

    const msgChatId         = msgChat ? msgChat.id : 0,

          msgIsGroup        = !!(msgChat && msgChat.type === "group"),
          msgIsReply        = !!(msg && msg.reply_to_message);

    const botPlugin         = srvBot.plugin,
          botFilters        = srvBot.filters,

          reqCtxBot         = createReqCtx(bdataType);

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
                    onEnd(plCallback(reqCtxBot));
                }
                else {
                    plCallback(reqCtxBot, onEnd);
                }
            }

            return;
        }

        if(plCallback.length < 3) {
            onEnd(plCallback(evName, reqCtxBot));
        }
        else {
            plCallback(evName, reqCtxBot, onEnd);
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
            case "inlineQuery":
                callEvent(evName, inlineQuery.query);
                break;

            case "text":
                let msgText = msg.text;

                cmdParam = rParseCmd(msgText);

                //-----[Filter: botName]----}>

                if(msgIsGroup && msgChatId < 0 && msgText[0] === "@" && !msg.reply_to_message) {
                    msg.text = msgText = msgText.replace(gReReplaceBotName, "");
                }

                //-----[CMD]----}>

                if(cmdParam && (callEvent(cmdParam.cmd, cmdParam) || callEvent("/", cmdParam))) {
                    return;
                }

                //-----[RE]----}>

                const ftLenRe = botFilters.regexp.length;

                if(ftLenRe) {
                    let rule, reParams;

                    for(let re, i = 0; !rule && i < ftLenRe; i++) {
                        re = botFilters.regexp[i];
                        reParams = msgText.match(re.rule);

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
                        botFilters.ev.emit(rule, reqCtxBot, reParams);
                        return;
                    }
                }

                break;

            default:
                break;
        }

        if(!evName || !(msgType && callEvent(evName, msg[msgType])) && !callEvent("*", cmdParam)) {
            if(srvBot.onMsg) {
                setImmediate(srvBot.onMsg, reqCtxBot, cmdParam);
            }
        }

        //-------]>

        function callEvent(type, params) {
            if(state) {
                type += ":" + state;
            }

            if(botFilters.ev.listenerCount(type)) {
                botFilters.ev.emit(type, reqCtxBot, params);
                return true;
            }

            return false;
        }
    }

    //-------)>

    function createReqCtx(type) {
        const result = Object.create(srvBot.ctx);

        result.isGroup = msgIsGroup;
        result.isReply = msgIsReply;

        switch(type) {
            case C_BD_TYPE_MESSAGE:
                result.answer = (isReply) => {
                    const answer = new rResponseBuilder(result, botInstance);
                    answer.isReply = !!isReply;

                    return answer;
                };

                result.from = result.cid = msgChatId;
                result.mid = msg.message_id;

                result.message = msg;

                break;

            case C_BD_TYPE_INLINE_QUERY:
                result.qid = inlineQuery.id;
                result.inlineQuery = inlineQuery;

                break;

            default:
                break;
        }

        //---------------]>

        return result;
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

        default:
            break;
    }

    return type;
}

function getTypeMsg(m) {
    let t;

    if(
        hasOwnProperty.call(m, t = "text") ||
        hasOwnProperty.call(m, t = "photo") ||
        hasOwnProperty.call(m, t = "audio") ||
        hasOwnProperty.call(m, t = "document") ||
        hasOwnProperty.call(m, t = "sticker") ||
        hasOwnProperty.call(m, t = "video") ||
        hasOwnProperty.call(m, t = "voice") ||
        hasOwnProperty.call(m, t = "contact") ||
        hasOwnProperty.call(m, t = "location") ||

        hasOwnProperty.call(m, t = "new_chat_participant") ||
        hasOwnProperty.call(m, t = "left_chat_participant") ||

        hasOwnProperty.call(m, t = "new_chat_title") ||
        hasOwnProperty.call(m, t = "new_chat_photo") ||
        hasOwnProperty.call(m, t = "delete_chat_photo") ||

        hasOwnProperty.call(m, t = "group_chat_created") ||
        hasOwnProperty.call(m, t = "supergroup_chat_created") ||
        hasOwnProperty.call(m, t = "channel_chat_created") ||

        hasOwnProperty.call(m, t = "migrate_to_chat_id") ||
        hasOwnProperty.call(m, t = "migrate_from_chat_id")
    ) {
        return t;
    }
}

//---------]>

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