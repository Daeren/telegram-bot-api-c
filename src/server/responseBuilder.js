//-----------------------------------------------------
//
// Author: Daeren
// Site: 666.io
//
//-----------------------------------------------------

"use strict";

//-----------------------------------------------------

const rSendApiMethods = require("./../sendMethods");

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

function CMain(botReqCtx, botInstance) {
    this.botReqCtx      = botReqCtx;
    this.botInstance    = botInstance;

    this.queue          = null;
    this.lastElement    = null;

    this.isReply        = false;
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
                let queue = this.queue;

                if(!queue) {
                    this.queue = queue = [];
                }

                queue.push(lastElement);
            }

            this.lastElement = elem;

            //-----)>

            if(this.isReply) {
                elem.reply_to_message_id = this.botReqCtx.mid;
            }

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

    data = arguments.length ? data : false;
    data = this.botInstance.keyboard(data, params);

    lastElement.reply_markup = data;

    if(data.selective) {
        lastElement.reply_to_message_id = this.botReqCtx.mid;
    }
    else {
        delete lastElement.reply_to_message_id;
    }

    //--------]>

    return this;
};

CMain.prototype.render = function(data) {
    const bot           = this.botInstance,
          lastElement   = this.lastElement,

          text          = lastElement.text,
          kb            = lastElement.reply_markup;

    //--------]>

    if(text) {
        lastElement.text = bot.render(text, data);
    }

    if(kb && kb.keyboard) {
        kb.keyboard.forEach(x => {
            x.forEach((y, i) => {
                x[i] = bot.render(y, data);
            });
        });
    }

    //--------]>

    return this;
};

//-----[Exec]-----}>

CMain.prototype.send = function(callback) {
    const queue     = this.queue;
    let lastElement = this.lastElement;

    //-------]>

    if(queue) {
        queue.push(lastElement);
        lastElement = queue;

        this.queue = null;
    }

    this.lastElement = null;

    //--------]>

    return this.botInstance.send(this.botReqCtx.cid, lastElement, callback);
};
