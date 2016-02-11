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
                    setImmediate(() => { throw error });
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
                let msgText = msg.text;

                cmdParam = rParseCmd(msgText);

                //-----[Filter: botName]----}>

                if(msgIsGroup && msgChatId < 0 && msgText[0] === "@" && !msg.reply_to_message) {
                    msg.text = msgText = msgText.replace(gReReplaceBotName, "");
                }

                //-----[CMD]----}>

                if(cmdParam && (callEventWithState(cmdParam.cmd, cmdParam) || callEventWithState("/", cmdParam))) {
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

        if(!evName || !(msgType && callEventWithState(evName, msg[msgType])) && !callEventWithState("*", cmdParam)) {
            const onMsg = srvBot.onMsg;

            if(onMsg && !callGenerator(onMsg, cmdParam)) {
                setImmediate(onMsg, reqCtxBot, cmdParam);
            }
        }

        //-------]>

        function callGenerator(func, params) {
            if(func && func.constructor.name === "GeneratorFunction") {
                executeGenerator(func(reqCtxBot, params), function(error) {
                    if(error && !callEventError(error)) {
                        setImmediate(() => { throw error });
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

            callEvent(type, params);
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

    function callEvent(type, params) {
        if(botFilters.ev.listenerCount(type)) {
            botFilters.ev.emit(type, reqCtxBot, params);
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