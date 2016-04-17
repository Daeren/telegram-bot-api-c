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
        onIncomingCallbackQuery(srvBot, dataCallbackQuery, onEnd);
    }
    else if(dataChosenInlineResult && typeof(dataChosenInlineResult) === "object") {
        onIncomingChosenInlineResult(srvBot, dataChosenInlineResult, onEnd);
    }
    else if(dataInlineQuery && typeof(dataInlineQuery) === "object") {
        onIncomingInlineQuery(srvBot, dataInlineQuery, onEnd);
    }
    else if(dataMessage && typeof(dataMessage) === "object") {
        onIncomingMessage(srvBot, dataMessage, onEnd);
    }

    //-------)>

    function onEnd(error, reqCtx, cmd, gotoState) {
        if(error) {
            onError(error);
        }
        else if(reqCtx) {
            onDefault();
        }

        //-------]>

        function onDefault() {
            const onMsg = srvBot.onMsg;

            if(onMsg && !callGenerator(null, onMsg, onError)) {
                setImmediate(onMsg, reqCtx, cmd, gotoState);
            }
        }

        function onError(error) {
            if(error) {
                const cbCatch = srvBot.cbCatch;

                if(cbCatch && !callGenerator(error, cbCatch)) {
                    setImmediate(cbCatch, error);
                }
                else {
                    throw error;
                }
            }
        }

        function callGenerator(error, func, callback) {
            if(func && func.constructor.name === "GeneratorFunction") {
                executeGenerator(error ? func(error) : func(reqCtx, cmd, gotoState), callback);
                return true;
            }

            return false;
        }
    }
}

//----------------------------------------]>

function onIncomingCallbackQuery(srvBot, input, callback) {
    runAction("callbackQuery", srvBot.plugins, srvBot.events, input, createReqCtx(), null, null, callback);

    //------------]>

    function createReqCtx() {
        const result = Object.create(srvBot.ctx);
        const botApi = srvBot.instance.api;

        //---------]>

        result.cqid = input.id;
        result.qid = input.inline_message_id;
        result.callbackQuery = input;

        result.answer = answer;

        //---------]>

        return result;

        //---------]>

        function answer(result, callback) {
            let data;

            if(typeof(result) === "function") {
                callback = result;
                result = null;
            }

            if(result) {
                data = typeof(result) === "string" ? {"text": result} : Object.create(result);
                data.callback_query_id = data.callback_query_id || this.cqid;
            }

            return botApi.answerCallbackQuery(data, callback);
        }
    }
}

function onIncomingChosenInlineResult(srvBot, input, callback) {
    runAction("chosenInlineResult", srvBot.plugins, srvBot.events, input, createReqCtx(), null, null, callback);

    //------------]>

    function createReqCtx() {
        const result = Object.create(srvBot.ctx);

        //---------]>

        result.qid = input.inline_message_id;
        result.chosenInlineResult = input;

        //---------]>

        return result;
    }
}

function onIncomingInlineQuery(srvBot, input, callback) {
    runAction("inlineQuery", srvBot.plugins, srvBot.events, input, createReqCtx(), null, null, callback);

    //------------]>

    function createReqCtx() {
        const result = Object.create(srvBot.ctx);
        const botApi = srvBot.instance.api;

        //---------]>

        result.qid = input.id;

        result.inlineQuery = input;
        result.answer = answer;

        //---------]>

        return result;

        //---------]>

        function answer(results, callback) {
            let data;

            if(typeof(results) === "function") {
                callback = results;
                results = null;
            }

            if(results) {
                data = Array.isArray(results) ? {"results": results} : Object.create(results);
                data.inline_query_id = data.inline_query_id || this.qid;
            }

            return botApi.answerInlineQuery(data, callback);
        }
    }
}

function onIncomingMessage(srvBot, input, callback) {
    const msgType           = getMessageDataField(input),
          evName            = getEventNameByMsgField(msgType);

    const msgChat           = input.chat;

    const isGroup           = !!(msgChat && (msgChat.type === "group" || msgChat.type === "supergroup")),
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

    runAction("message", srvBot.plugins, srvBot.events, input, createReqCtx(), evName, msgType, callback);

    //------------]>

    function createReqCtx() {
        const result = Object.create(srvBot.ctx);

        //---------]>

        result.isGroup = isGroup;
        result.isReply = isReply;

        result.from = result.cid = msgChat.id;
        result.mid = input.message_id;

        result.message = input;
        result.answer = answer;

        //---------]>

        return result;

        //---------]>

        function answer(isReply) {
            const answer = new rResponseBuilder(result, botInstance);
            answer.isReply = !!isReply;

            return answer;
        }
    }
}

//---------]>

function runAction(ingDataType, queue, events, input, reqCtx, evName, dataField, callback) {
    const data = dataField ? input[dataField] : null;

    let cmdParams;

    //------------]>

    if(!cmdParams && evName === "text") {
        cmdParams = rParseCmd(data);
    }

    rUtil.forEachAsync(queue, iterQueue, onEndQueue);

    //------------]>

    function iterQueue(next, plugin) {
        const plType            = plugin[0],
              plParams          = plugin[1],
              plIsFilter        = plugin[2],
              plCallback        = plugin[3];

        const isPlGenerator     = plCallback.constructor.name === "GeneratorFunction",
              isPlWithFilter    = !!plType,
              isPlSync          = isPlGenerator ? false : plCallback.length < 3;

        let plData              = data,
            isEnd               = false;

        let cbPlResult;

        //----------]>

        if(isPlWithFilter) {
            if(ingDataType === plType) {
                plData = input;
            }
            else if(cmdParams && cmdParams.cmd === plType) {
                plData = cmdParams;
            }
            else if(evName !== plType) {
                onNext();
                return;
            }
            else if(plIsFilter && (plIsFilter instanceof RegExp)) {
                plData = plData.match(plIsFilter);

                if(!plData) {
                    onNext();
                    return;
                }

                if(plParams) {
                    const result  = {};

                    for(let i = 0, len = Math.min(plData.length - 1, plParams.length); i < len; i++) {
                        result[plParams[i]] = plData[i + 1];
                    }

                    plData = result;
                }
            }
        }

        //---------]>

        try {
            cbPlResult = isPlGenerator || isPlSync ? plCallback(reqCtx, plData) : plCallback(reqCtx, plData, onNext);
        } catch(error) {
            onNext(error);
            return;
        }

        //---------]>

        if(isPlGenerator) {
            executeGenerator(cbPlResult, (error, result) => onNext(error || result));
        }

        if(isPlSync) {
            onNext(cbPlResult);
        }

        //---------]>

        function onNext(state) {
            if(isEnd) {
                throw new Error("Plugin: double call `next`");
            }

            isEnd = true;

            setImmediate(next, state);
        }
    }

    function onEndQueue(state) {
        if(state && state instanceof Error) {
            callback(state, reqCtx, cmdParams);
        }
        else {
            const evType = cmdParams ? cmdParams.cmd : (evName || ingDataType);
            queue = events && events[state ? (evType + ":" + state) : evType];

            if(queue) {
                runAction(ingDataType, queue, null, input, reqCtx, evName, dataField, callback);
            }
            else {
                callback(null, events ? reqCtx : null, cmdParams, state);
            }
        }
    }
}

//---------]>

function getEventNameByMsgField(field) {
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
    callback = callback || pushException;

    //---------]>

    (function execute(input) {
        let next;

        try {
            next = generator.next(input);
        } catch(e) {
            callback(e);
            return;
        }

        if(!next.done) {
            next.value.then(r => execute(r), onGenError);
        }
        else {
            callback(null, next.value);
        }
    })();

    //---------]>

    function pushException(error) {
        if(error) {
            setImmediate(function() { throw error; });
        }
    }

    function onGenError(error) {
        try {
            generator.throw(error);
        } catch(e) {
            callback(e);
        }
    }
}