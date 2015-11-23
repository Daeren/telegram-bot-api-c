//-----------------------------------------------------
//
// Author: Daeren
// Site: 666.io
//
//-----------------------------------------------------

"use strict";

//-----------------------------------------------------

const rSendApiMethods = require("./../send/methods");

//-----------------------------------------------------

const gElements = rSendApiMethods.keys;
const gModifiers = [
    "maxSize", "filename",
    "latitude", "longitude",

    "disable_web_page_preview",
    "parse_mode",
    "caption", "duration", "performer", "title",
    "reply_to_message_id"
];

//-----------------------------------------------------

module.exports = CMain;

//-----------------------------------------------------

function CMain(botReq, botPCurrent) {
    // botPCurrent.(send) => || srvCtx => [srvBot.(ctx send)] || => reqCtx.(data cid)
    // ^-| use

    this.botReq         = botReq;
    this.botPCurrent    = botPCurrent;

    this.queue          = [];
    this.lastElement    = null;
}

//-----[Elements]-----}>

gElements
    .forEach(function(name) {
        CMain.prototype[name] = function(data, params) {
            const lastElement   = this.lastElement,
                  elem          = params ? Object.create(params) : {};

            //--------]>

            elem[name] = data;

            if(lastElement) {
                this.queue.push(lastElement);
            }

            this.lastElement = elem;

            //--------]>

            return this;
        };
    });

//-----[Modifiers]-----}>

gModifiers
    .forEach(function(name) {
        let defValue;

        const funcName = name
            .split("_")
            .map(function(e, i) {
                if(!i && e === "disable") {
                    defValue = true;
                }

                return i ? (e[0].toUpperCase() + e.substr(1)) : e;
            })
            .join("");

        //--------]>

        CMain.prototype[funcName] = function(v) {
            this.lastElement[name] = typeof(v) === "undefined" ? defValue : v;
            return this;
        };
    });

//----)>

CMain.prototype.keyboard = function(data, params) {
    const lastElement = this.lastElement;

    //--------]>

    if(typeof(data) === "undefined" || data === null) {
        data = this.botPCurrent.keyboard.hide();
    }
    else {
        if(typeof(data) !== "object" || Array.isArray(data)) {
            data = this.botPCurrent.keyboard(data, params);
        }
    }

    lastElement.reply_markup = data;

    if(data.selective) {
        lastElement.reply_to_message_id = this.botReq.mid;
    }
    else {
        delete lastElement.reply_to_message_id;
    }

    //--------]>

    return this;
};

//-----[Exec]-----}>

CMain.prototype.send = function(callback) {
    const queue     = this.queue;

    let lastElement = this.lastElement;

    //-------]>

    if(queue.length) {
        queue.push(lastElement);
        lastElement = queue;

        this.queue = [];
    }

    this.lastElement = null;

    return this.botPCurrent.send(this.botReq.cid, lastElement, callback);
};
