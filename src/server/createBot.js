//-----------------------------------------------------
//
// Author: Daeren
// Site: 666.io
//
//-----------------------------------------------------

"use strict";

//-----------------------------------------------------

const rEvents = require("events");

//-----------------------------------------------------

const gMaxListeners = 100;

const gMapSendMethods      = {
    "text":         "sendMessage",
    "photo":        "sendPhoto",
    "audio":        "sendAudio",
    "document":     "sendDocument",
    "sticker":      "sendSticker",
    "video":        "sendVideo",
    "voice":        "sendVoice",
    "location":     "sendLocation",
    "action":       "sendChatAction"
};

//-----------------------------------------------------

module.exports = main;

//-----------------------------------------------------

function main(bot, onMsg) {
    /*jshint validthis:true */

    let result;

    const ctx   = Object.create(bot),
          ev    = new rEvents();

    //---------]>

    ev.setMaxListeners(gMaxListeners);

    //---------]>

    result = {
        "instance":     bot,
        "ctx":          ctx,

        "plugin":       [],

        "filters": {
            "ev":       ev,
            "regexp":   []
        },

        "cbLogger":     null,

        //-----)>

        "use":          srvUse,

        "on":           srvEvOn,
        "off":          srvEvOff,

        "logger":       srvLogger,

        //-----)>

        "onMsg":        onMsg
    };

    //-----)>

    ctx.render  = ctxRender;
    ctx.send    = ctxSend;
    ctx.forward = ctxForward;
    ctx.answer  = ctxAnswer;

    //-----[Send methods]-----}>

    for(let fieldName in gMapSendMethods) {
        const methodName = gMapSendMethods[fieldName];
        const apiMethod = bot.api[methodName];

        ctx[methodName] = function(input, params, callback) {
            if(typeof(params) === "function") {
                callback = params;
                params = undefined;
            }

            //-----------]>

            const data = params ? Object.create(params) : {};

            data.chat_id = params && params.chat_id || this.cid;

            //---)>

            switch(fieldName) {
                case "location":
                    if(!input) {
                        break;
                    }

                    if(typeof(input) === "string") {
                        input = input.split(/\s+/);
                    }
                    else if(typeof(input) === "object") {
                        data.latitude = input.latitude;
                        data.longitude = input.longitude;
                    }

                    if(Array.isArray(input)) {
                        data.latitude = input[0];
                        data.longitude = input[1];
                    }

                    break;

                default:
                    data[fieldName] = input;
            }

            //-----------]>

            return callback ?  apiMethod(data, callback) : apiMethod(data);
        };
    }

    //--------------]>

    return result;

    //--------------]>

    function ctxRender(template, data, callback) {
        if(hasOwnProperty.call(data, "input")) {
            data = data.input;
        }

        template = bot.render(template, data);

        //------]>

        data = data ? Object.create(data) : {};

        data.chat_id = this.cid;
        data.text = template;

        //-------------]>

        return arguments.length < 2 ? bot.api.sendMessage(data) : bot.api.sendMessage(data, callback);
    }

    function ctxSend(data, callback) {
        return bot.send(this.cid, data, callback);
    }

    function ctxForward(callback) {
        const data = {
            "chat_id":      this.to,
            "from_chat_id": this.from,
            "message_id":   this.mid
        };

        return arguments.length < 1 ? bot.api.forwardMessage(data) : bot.api.forwardMessage(data, callback);
    }

    function ctxAnswer(results, callback) {
        let data;

        if(Array.isArray(results)) {
            data = {
                "inline_query_id":  this.qid,
                "results":          results
            };
        }
        else {
            data = Object.create(results);
            data.inline_query_id = this.qid;
        }

        return arguments.length < 2 ? bot.api.answerInlineQuery(data) : bot.api.answerInlineQuery(data, callback);
    }

    //-----)>

    function srvUse(type, callback) {
        if(typeof(type) === "function") {
            callback = type;
            type = undefined;
        }

        result.plugin.push([type, callback]);

        return this;
    }

    function srvEvOn(rule, params, func) {
        if(typeof(params) === "function") {
            func = params;
            params = undefined;
        }

        //------]>

        if(typeof(rule) === "string") {
            const t = rule.split(/\s+/);

            if(t.length > 1) {
                rule = t;
            }
        }

        //---)>

        if(Array.isArray(rule)) {
            rule.forEach(function(e) {
                srvEvOn(e, params, func);
            });

            return this;
        }

        //------]>

        const fltEv   = result.filters.ev,
              fltRe   = result.filters.regexp;

        switch(typeof(rule)) {
            case "string":
                fltEv.on(rule, func);

                break;

            case "object":
                if(rule instanceof RegExp) {
                    if(!fltEv.listenerCount(rule)) {
                        if(params) {
                            if(typeof(params) === "string") {
                                params = params.split(/\s+/);
                            }

                            if(!Array.isArray(params)) {
                                throw new Error("on | RegExp | `params` is not an array");
                            }
                        }

                        fltRe.push({
                            "rule":     rule,
                            "binds":    params
                        });
                    }

                    fltEv.on(rule, func);

                    break;
                }

            default:
                throw new Error("Unknown rule: " + rule);
        }

        return this;
    }

    function srvEvOff(rule, func) {
        if(Array.isArray(rule)) {
            rule.forEach(function(e) {
                srvEvOff(e, func);
            });

            return this;
        }

        //------]>

        const filters = result.filters;

        const fltEv   = filters.ev,
              fltRe   = filters.regexp;

        //------]>

        if(arguments.length && !fltEv.listenerCount(rule)) {
            return this;
        }

        //------]>

        if(arguments.length <= 1) {
            if(arguments.length) {
                switch(typeof(rule)) {
                    case "object":
                        if(rule instanceof RegExp) {
                            removeFltRegExp(getIdFltRegExp(rule));
                        }

                        break;

                    default:
                        break;
                }
            }
            else {
                filters.regexp = [];
            }

            ev.removeAllListeners(rule);

            return this;
        }

        //------]>

        switch(typeof(rule)) {
            case "string":
                fltEv.removeListener(rule, func);

                break;

            case "object":
                if(rule instanceof RegExp) {
                    const id = getIdFltRegExp(rule);

                    if(id >= 0) {
                        fltEv.removeListener(rule, func);

                        if(!fltEv.listenerCount(rule)) {
                            removeFltRegExp(id);
                        }
                    }
                }

                break;

            default:
                break;
        }

        //------]>

        return this;

        //------]>

        function getIdFltRegExp(obj) {
            for(let i = 0, len = fltRe.length; i < len; i++) {
                if(fltRe[i].rule === obj) {
                    return i;
                }
            }

            return -1;
        }

        function removeFltRegExp(id) {
            if(id >= 0) {
                fltRe.splice(id, 1);
                return true;
            }

            return false;
        }
    }

    function srvLogger(callback) {
        result.cbLogger = callback;
        return this;
    }
}