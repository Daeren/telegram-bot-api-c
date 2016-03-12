//-----------------------------------------------------
//
// Author: Daeren
// Site: 666.io
//
//-----------------------------------------------------

"use strict";

//-----------------------------------------------------

const rParseCmd         = require("./../parseCmd"),
      rResponseBuilder  = require("./responseBuilder");

//-----------------------------------------------------

const gReReplaceBotName = /^@\w{5,32}\s*/;

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

          msgIsGroup        = !!(msgChat && (msgChat.type === "group" || msgChat.type === "supergroup")),
          msgIsReply        = !!(msg && msg.reply_to_message);

    const botPlugin         = srvBot.plugin,
          botFilters        = srvBot.filters,

          reqCtxBot         = createReqCtx(bdataType);

    //-----[Filter: botName]----}>

    if(evName === "text" && msgIsGroup && msg.text[0] === "@" && !msg.reply_to_message && botInstance.disabled("onMsg.skipFilterBotName")) {
        const t = msg.text = msg.text.replace(gReReplaceBotName, "");

        if(!t) {
            return;
        }
    }

    //------------]>

    forEachAsync(botPlugin, onIterPlugin, onEndPlugin);

    //------------]>

    function onIterPlugin(next, plugin) {
        const plType            = plugin[0],
              plCallback        = plugin[1];

        const isPlGenerator     = plCallback.constructor.name === "GeneratorFunction",
              isPlWithFilter    = typeof(plType) !== "undefined",
              isPlSync          = isPlGenerator ? false : plCallback.length < (isPlWithFilter ? 2 : 3);

        let isEnd = false;

        let result;

        //----------]>

        if(isPlWithFilter) {
            if(evName !== plType) {
                onEnd();
                return;
            }

            result = isPlGenerator || isPlSync ? plCallback(reqCtxBot) : plCallback(reqCtxBot, onEnd);
        }
        else {
            result = isPlGenerator || isPlSync ? plCallback(evName, reqCtxBot) : plCallback(evName, reqCtxBot, onEnd);
        }

        callGenerator();

        if(isPlSync) {
            onEnd(result);
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
                callEventWithState(evName, inlineQuery.query);

                break;

            case "text":
                const msgText = msg.text;

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
            const data = msgType ? msg[msgType] : null;
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
            return type;
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