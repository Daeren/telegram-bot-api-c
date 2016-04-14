//-----------------------------------------------------
//
// Author: Daeren
// Site: 666.io
//
//-----------------------------------------------------

"use strict";

//-----------------------------------------------------

const rUtil         = require("./../util"),
      rAPIProto     = require("./../api/proto");

//-----------------------------------------------------

const gModifiers = [
    "maxSize", "filename",

    "latitude", "longitude",
    "caption", "duration", "performer", "title", "width", "height",

    "disable_web_page_preview", "disable_notification",
    "show_alert",

    "phone_number", "first_name", "last_name",
    "parse_mode", "reply_markup",

    "reply_to_message_id", "message_id", "inline_message_id"
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

CMain.prototype = Object.create(null);

//-----[Elements]-----}>

(function createElements() {
    rAPIProto.genSendMethodsFor(addElementMethod);

    function addElementMethod(alias, original, baseDataField) {
        CMain.prototype[alias] = function(input, params) {
            const lastElement   = this.lastElement,
                  elem          = params ? Object.create(params) : {};

            //--------]>

            elem.__method__ = original;

            if(input !== null && typeof(input) !== "undefined" && !rAPIProto.dataModifierForSendMethod(original, input, elem)) {
                elem[baseDataField] = input;
            }

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
    }
})();

//-----[Modifiers]-----}>

gModifiers
    .forEach(function(name) {
        let defValue;

        const funcName = name
            .split("_")
            .map(function(e, i) {
                if(!i && (e === "disable" || e === "show")) {
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
    const botInstance   = this.botInstance,
          chatId        = this.botReqCtx.cid;

    const queue         = this.queue,
          lastElement   = this.lastElement;

    //-------]>

    if(queue) {
        queue.push(lastElement);
        this.queue = null;
    }

    this.lastElement = null;

    //--------]>

    if(typeof(callback) === "undefined") {
        return new botInstance.mdPromise(cbPromise);
    }

    cbPromise();

    //--------]>

    function cbPromise(resolve, reject) {
        callback = callback || ((error, result) => error ? reject(error) : resolve(result));

        //-----]>

        const results = queue ? [] : null;

        if(queue) {
            rUtil.forEachAsync(queue, iterElements, callback);
        }
        else {
            iterElements(callback, lastElement, 0);
        }

        //-----]>

        function iterElements(next, elem, index) {
            const apiMethod = botInstance.api[elem.__method__];

            if(!elem.chat_id) {
                elem.chat_id = chatId;
            }

            apiMethod(elem, function(error, result) {
                if(error) {
                    error.index = index;
                    error.results = results;
                }
                else if(results) {
                    results.push(result);
                }

                next(error, results || result);
            });
        }
    }
};