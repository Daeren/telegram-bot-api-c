//-----------------------------------------------------
//
// Author: Daeren
// Site: 666.io
//
//-----------------------------------------------------

"use strict";

//-----------------------------------------------------

const rResponseBuilder  = require("./responseBuilder");

//-----------------------------------------------------

module.exports = main;

//-----------------------------------------------------

function main(bot, onMsg) {
    /*jshint validthis:true */

    const ctx = Object.create(bot);

    const result = {
        "instance":     bot,
        "ctx":          ctx,

        "plugins":      [],
        "events":       new Map(),

        "cbCatch":      null,

        //-----)>

        "use":          srvUse,

        "on":           srvEvOn,
        "off":          srvEvOff,

        "catch":        srvCatch,

        //-----)>

        "onMsg":        onMsg
    };

    //--------------]>

    ctx.answer  = ctxAnswer;

    //--------------]>

    return result;

    //--------------]>

    function ctxAnswer() {
        return new rResponseBuilder(this, bot);
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

        if(!result.events.has(type)) {
            result.events.set(type, []);
        }

        result.events.get(type).push(event.result);

        //--------]>

        return this;
    }

    function srvEvOff(type, callback) {
        const evProto   = buildEvent(type, null, callback),
              events    = evProto && result.events.get(evProto.type);

        if(events) {
            const target = evProto.result;

            let len = events.length;

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