//-----------------------------------------------------
//
// Author: Daeren
// Site: 666.io
//
//-----------------------------------------------------

"use strict";

//-----------------------------------------------------

const rUtil             = require("./../util"),
      rParseCmd         = require("./../parseCmd"),

      rResponseBuilder  = require("./responseBuilder");

//-----------------------------------------------------

const C_BD_TYPE_UNKNOWN                 = 0,
      C_BD_TYPE_MESSAGE                 = 1,
      C_BD_TYPE_INLINE_QUERY            = 2,
      C_BD_TYPE_CHOSEN_INLINE_RESULT    = 3,
      C_BD_TYPE_CALLBACK_QUERY          = 4;

//----------------------]>

const gReReplaceBotName = /^@\w{5,32}\s+|^@\w{5,32}$/;

//-----------------------------------------------------

module.exports = main;

//-----------------------------------------------------

function main(srvBot, data) {
    if(!data || typeof(data) !== "object") {
        return;
    }

    //--------]>

    const dataMessage               = data.message,
          dataInlineQuery           = data.inline_query,
          dataChosenInlineResult    = data.chosen_inline_result,
          dataCallbackQuery         = data.callback_query;

    //--------]>

    if(dataCallbackQuery && typeof(dataCallbackQuery) === "object") {
        onIncomingCallbackQuery(dataCallbackQuery);
    }
    else if(dataChosenInlineResult && typeof(dataChosenInlineResult) === "object") {
        onIncomingChosenInlineResult(dataChosenInlineResult);
    }
    else if(dataInlineQuery && typeof(dataInlineQuery) === "object") {
        onIncomingInlineQuery(dataInlineQuery);
    }
    else if(dataMessage && typeof(dataMessage) === "object") {
        onIncomingMessage(dataMessage);
    }







    const botInstance               = srvBot.instance;




    // || bdType === C_BD_TYPE_UNKNOWN
const

    bdType            = getBDTypeByMsg(data),
    bdName            = getBDNameByType(bdType);

    let msgType             = null,
        evName              = null,
        bdName              = getBDNameByType(bdType),
        cmdParam            = null;

    //--------]>

    
    switch(bdType) {
        case C_BD_TYPE_MESSAGE:
            msgType = getTypeMsg(dataMessage);
            evName = getEventNameByTypeMsg(msgType);

            break;

        default:
            evName = bdName;
    }

    //--------]>

    const msgChat           = dataMessage ? dataMessage.chat : null;

    const msgChatId         = msgChat ? msgChat.id : 0,

          msgIsGroup        = !!(msgChat && (msgChat.type === "group" || msgChat.type === "supergroup")),
          msgIsReply        = !!(dataMessage && dataMessage.reply_to_message);

    const botPlugins        = srvBot.plugins,
          botFilters        = srvBot.filters,

          reqCtxBot         = createReqCtx(bdType);

    //-----[Filter: botName]----}>

    if(
        msgIsGroup && evName === "text" && dataMessage.text[0] === "@" &&
        !dataMessage.reply_to_message && botInstance.disabled("onMsg.skipFilterBotName")
    ) {
        const t = dataMessage.text = dataMessage.text.replace(gReReplaceBotName, "");

        if(!t) {
            return;
        }
    }

    //------------]>

    rUtil.forEachAsync(botPlugins, onIterPlugins, onEndPlugins);

    //------------]>

    function onIterPlugins(next, plugin) {
        const plType            = plugin[0],
              plCallback        = plugin[1];

        const isPlGenerator     = plCallback.constructor.name === "GeneratorFunction",
              isPlWithFilter    = typeof(plType) !== "undefined",
              isPlSync          = isPlGenerator ? false : plCallback.length < (isPlWithFilter ? 2 : 3);

        let isEnd = false;

        let state;

        //----------]>

        if(isPlWithFilter) {
            if(evName !== plType && bdName !== plType) {
                onEnd();
                return;
            }

            state = isPlGenerator || isPlSync ? plCallback(reqCtxBot) : plCallback(reqCtxBot, onEnd);
        }
        else {
            state = isPlGenerator || isPlSync ? plCallback(evName, reqCtxBot) : plCallback(evName, reqCtxBot, onEnd);
        }

        //---------]>

        callGenerator();

        if(isPlSync) {
            onEnd();
        }

        //---------]>

        function callGenerator() {
            if(!isPlGenerator) {
                return false;
            }

            executeGenerator(result, function(error, result) {
                if(!error) {
                    onEnd(result);
                    return;
                }

                if(!callEventError(error)) {
                    setImmediate(() => { throw error; });
                }
            });

            return true;
        }

        function onEnd() {
            if(isEnd) {
                throw new Error("Plugin: double call `next`");
            }

            isEnd = true;

            setImmediate(next, state);
        }
    }

    function onEndPlugins(state) {
        switch(evName) {
            case "inlineQuery":
                callEventWithState(evName, dataInlineQuery.query);

                break;

            case "text":
                const msgText = dataMessage.text;

                //-----[CMD]----}>

                cmdParam = rParseCmd(msgText);

                if(cmdParam) {
                    break;
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

        if(cmdParam) {
            callEventWithState(cmdParam.cmd, cmdParam) || callEventWithState("/", cmdParam) || state && callEvent("/", cmdParam, state) || callDefaultOnMsg();
        }
        else if(!evName) {
            callDefaultOnMsg();
        }
        else {
            const data = msgType ? dataMessage[msgType] : null;
            evName && callEventWithState(evName, data) || callEventWithState("*", data) || state && callEvent("*", data, state) || callDefaultOnMsg();
        }

        //-------]>

        function callDefaultOnMsg() {
            const onMsg = srvBot.onMsg;

            if(onMsg && !callGenerator(onMsg)) {
                setImmediate(onMsg, reqCtxBot, cmdParam, state);
            }
        }

        function callGenerator(func) {
            if(func && func.constructor.name === "GeneratorFunction") {
                func = func(reqCtxBot, cmdParam, state);

                executeGenerator(func, function(error) {
                    if(error && !callEventError(error)) {
                        setImmediate(() => { throw error; });
                    }
                });

                return true;
            }

            return false;
        }

        function callEventWithState(type, params) {
            if(state) {
                type += ":" + state;
            }

            return callEvent(type, params);
        }
    }

    //-------)>

    function createReqCtx(type) {
        const result = Object.create(srvBot.ctx);

        result.isGroup = msgIsGroup;
        result.isReply = msgIsReply;

        switch(type) {
            case C_BD_TYPE_MESSAGE:
                result.answer = function(isReply) {
                    const answer = new rResponseBuilder(result, botInstance);
                    answer.isReply = !!isReply;

                    return answer;
                };

                result.from = result.cid = msgChatId;
                result.mid = dataMessage.message_id;

                result.message = dataMessage;

                break;

            case C_BD_TYPE_INLINE_QUERY:
                result.qid = dataInlineQuery.id;
                result.inlineQuery = dataInlineQuery;

                break;

            default:
                break;
        }

        //---------------]>

        return result;
    }

    //----[Events: helpers]----}>

    function callEvent(type, params, state) {
        if(botFilters.ev.listenerCount(type)) {
            botFilters.ev.emit(type, reqCtxBot, params, state);
            return true;
        }

        return false;
    }

    function callEventError(error) {
        if(botFilters.ev.listenerCount("error")) {
            botFilters.ev.emit("error", error);
            return true;
        }

        return false;
    }
}

//----------------------------------------]>

function getBDTypeByMsg(data) {
    if(data) {
        const message               = data.message,
              inlineQuery           = data.inline_query,
              chosenInlineResult    = data.chosen_inline_result,
              callbackQuery         = data.callback_query;

        if(callbackQuery && typeof(callbackQuery) === "object") {
            return C_BD_TYPE_CALLBACK_QUERY;
        }
        else if(chosenInlineResult && typeof(chosenInlineResult) === "object") {
            return C_BD_TYPE_CHOSEN_INLINE_RESULT;
        }
        else if(inlineQuery && typeof(inlineQuery) === "object") {
            return C_BD_TYPE_INLINE_QUERY;
        }
        else if(message && typeof(message) === "object") {
            return C_BD_TYPE_MESSAGE;
        }
    }

    return C_BD_TYPE_UNKNOWN;
}

function getBDNameByType(type) {
    switch(type) {
        case C_BD_TYPE_MESSAGE:                 return "message";
        case C_BD_TYPE_INLINE_QUERY:            return "inlineQuery";
        case C_BD_TYPE_CHOSEN_INLINE_RESULT:    return "chosenInlineResult";
        case C_BD_TYPE_CALLBACK_QUERY:          return "callbackQuery";

        default:                                return "";
    }
}

function getEventNameByTypeMsg(type) {
    switch(type) {
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

        default:                        return type;
    }
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

//---------]>

function executeGenerator(generator, callback) {
    (function execute(input) {
        let next;

        try {
            next = generator.next(input);
        } catch(e) {
            callback(e);
        }

        if(!next.done) {
            next.value.then(r => execute(r), onGenError);
        }
        else {
            callback(null, next.value);
        }
    })();

    function onGenError(error) {
        try {
            generator.throw(error);
        } catch(e) {
            callback(e);
        }
    }
}