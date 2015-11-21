//-----------------------------------------------------
//
// Author: Daeren
// Site: 666.io
//
//-----------------------------------------------------

"use strict";

//-----------------------------------------------------

const rSendApiMethods = require("./send/methods");

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

function CMain(botReq, botFather) {
    // botFather.(send) => || srvCtx => [srvBot.(ctx send)] || => reqCtx.(data cid)
    // ^-| use

    this.botReq         = botReq;
    this.botFather      = botFather;

    this.stack          = [];
}

//-----[Elements]-----}>

gElements
    .forEach(function(name) {
        CMain.prototype[name] = function(data, params) {
            const lastElem = this.lastElem,
                  elem     = params ? Object.create(params) : {};

            //--------]>

            elem[name] = data;

            if(lastElem) {
                this.stack.push(lastElem);
            }

            this.lastElem = elem;

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
            this.lastElem[name] = typeof(v) === "undefined" ? defValue : v;
            return this;
        };
    });

//----)>

CMain.prototype.keyboard = function(data, params) {
    const lastElem  = this.lastElem,
          bot       = this.botReq;

    //--------]>

    if(typeof(data) === "undefined" || data === null) {
        data = bot.keyboard.hide();
    }
    else {
        if(typeof(data) !== "object" || Array.isArray(data)) {
            data = bot.keyboard(data, params);
        }
    }

    lastElem.reply_markup = data;

    if(data.selective) {
        lastElem.reply_to_message_id = bot.mid;
    }
    else {
        delete lastElem.reply_to_message_id;
    }

    //--------]>

    return this;
};

//-----[Exec]-----}>

CMain.prototype.send = function(callback) {
    const stack     = this.stack,
          bot       = this.botReq;

    const stackLen  = stack.length;

    //-------]>

    let lastElem    = this.lastElem;

    //-------]>

    if(stackLen) {
        stack.push(lastElem);
        lastElem = stack;

        this.stack = [];
    } else {
        this.lastElem = null;
    }

    return this.botFather.send(bot.cid, lastElem, callback);
};
