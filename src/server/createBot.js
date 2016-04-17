//-----------------------------------------------------
//
// Author: Daeren
// Site: 666.io
//
//-----------------------------------------------------

"use strict";

//-----------------------------------------------------

const rEvents       = require("events");

const rAPIProto     = require("./../api/proto");

//-----------------------------------------------------

const gMaxListeners = 100;

//-----------------------------------------------------

module.exports = main;

//-----------------------------------------------------

function main(bot, onMsg) {
    /*jshint validthis:true */

    const ctx   = Object.create(bot),
          ev    = new rEvents();

    let result;

    //---------]>

    ev.setMaxListeners(gMaxListeners);

    //---------]>

    result = {
        "instance":     bot,
        "ctx":          ctx,

        "plugins":      [],
        "events":       {},

        "cbLogger":     null,
        "cbCatch":      null,

        //-----)>

        "use":          srvUse,

        "on":           srvEvOn,
        "off":          srvEvOff,

        "logger":       srvLogger,
        "catch":        srvCatch,

        //-----)>

        "onMsg":        onMsg
    };

    //-----)>

    ctx.render  = ctxRender;
    ctx.forward = ctxForward;

    //-----[Send methods]-----}>

    rAPIProto.genSendMethodsFor(function(alias, original, baseDataField) {
        const apiMethod = bot.api[original];

        //-----------]>

        ctx[original] = function(input, params, callback) {
            if(typeof(params) === "function") {
                callback = params;
                params = undefined;
            }

            //-----------]>

            const data = params ? Object.create(params) : {};

            data.chat_id = params && params.chat_id || this.cid;

            if(input !== null && typeof(input) !== "undefined" && !rAPIProto.dataModifierForSendMethod(original, input, data)) {
                data[baseDataField] = input;
            }

            //-----------]>

            return apiMethod(data, callback);
        };
    });

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

        data.chat_id    = data.chat_id || this.cid;
        data.text       = template;

        //-------------]>

        return bot.api.sendMessage(data, callback);
    }

    function ctxForward(params, callback) {
        if(typeof(params) === "function") {
            callback = params;
            params = {};
        }
        else if(params) {
            params = Object.create(params);
        }
        else {
            params = {};
        }

        params.chat_id      = params.chat_id || this.to;
        params.from_chat_id = params.from_chat_id || this.from;
        params.message_id   = params.message_id || this.mid;

        return bot.api.forwardMessage(params, callback);
    }

    //-----)>

    function srvUse(type, params, callback) {
        const event = buildEvent(type, params, callback);

        //--------]>

        if(!event) {
            throw new Error("Failed to create event!");
        }

        result.plugins.push(event.result);

        //--------]>

        return this;
    }

    function srvEvOn(type, params, callback) {
        if(typeof(type) === "string") {
            const t = type.split(/\s+/);

            if(t.length > 1) {
                type = t;
            }
        }

        //---)>

        if(Array.isArray(type)) {
            type.forEach(e => srvEvOn(e, params, callback));
            return this;
        }

        //--------]>

        const event = buildEvent(type, params, callback);

        //--------]>

        if(!event) {
            throw new Error("Failed to create event!");
        }

        type = event.type;
        (result.events[type] = result.events[type] || []).push(event.result);

        //--------]>

        return this;
    }

    function srvEvOff(type, callback) {
        const evProto   = buildEvent(type, null, callback),
              events    = evProto && result.events[evProto.type];

        if(events) {
            const target    = evProto.result;

            let len         = events.length;

            while(len--) {
                const event = events[len];

                if(target[3] === event[3] && target[2] === event[2]) {
                    events.splice(len, 1);
                    break;
                }
            }
        }

        return this;
    }

    function srvLogger(callback) {
        result.cbLogger = callback;
        return this;
    }

    function srvCatch(callback) {
        result.cbCatch = callback;
        return this;
    }

    //-----)>

    function buildEvent(type, params, callback)  {
        let filter,
            result = null;

        //--------]>

        if(typeof(type) === "string") {
            filter = type.split(":");

            type = filter[0];
            filter = filter[1];
        }

        //------]>

        if(typeof(type) === "function") {
            callback = type;
            type = null;
        } else if(typeof(params) === "function") {
            callback = params;
            params = null;
        }

        if(!callback) {
            return result;
        }

        //------]>

        if(type instanceof RegExp) {
            if(params) {
                if(typeof(params) === "string") {
                    params = params.split(/\s+/);
                }

                if(!Array.isArray(params)) {
                    throw new Error("buildEvent | RegExp | `params` is not an array");
                }
            }

            result = ["text", params, type, callback];
        }
        else {
            result = [type, params, null, callback];
        }

        type = result[0];
        type = filter ? (type + ":" + filter) : type;

        result = {type, result};

        //------]>

        return result;
    }
}