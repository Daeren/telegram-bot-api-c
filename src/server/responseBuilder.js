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
    "cache_time", "next_offset", "switch_pm_text", "switch_pm_parameter",

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

    this.enabledReply   = false;
}

CMain.prototype = Object.create(null);

//-----[Elements]-----}>

(function createElements() {
    rAPIProto.genSendMethodsFor(addElementMethod);

    addElementMethod("inlineQuery", "answerInlineQuery");
    addElementMethod("callbackQuery", "answerCallbackQuery");

    addElementMethod("markdown", "sendMessage", {"parse_mode": "markdown"});
    addElementMethod("html", "sendMessage", {"parse_mode": "html"});

    //-------]>

    function addElementMethod(alias, original, defaultParams) {
        const argsTable = Array.prototype.slice.call(rAPIProto.args[original], 1);

        CMain.prototype[alias] = function() {
            const lastElement   = this.lastElement,
                  elem          = defaultParams ? Object.create(defaultParams) : {};

            let argsLen         = arguments.length;

            //--------]>

            elem.__method__ = original;

            //--------]>

            while(argsLen--) {
                const input = arguments[argsLen];

                if(input !== null && typeof(input) !== "undefined" && !rAPIProto.dataModifierForSendMethod(original, input, elem)) {
                    elem[argsTable[argsLen]] = input;
                }
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

            if(this.enabledReply) {
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

CMain.prototype.isReply = function(t) {
    this.enabledReply = typeof(t) === "undefined" ? true : !!t;
    return this;
};

CMain.prototype.keyboard = function(data, params) {
    const lastElement = this.lastElement;

    //--------]>

    if(Array.isArray(data)) {
        data = {"keyboard": data};
    }
    else if(typeof(data) !== "object") {
        data = arguments.length ? data : false;
        data = this.botInstance.keyboard(data, params);
    }

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

CMain.prototype.inlineKeyboard = function(data, isVertically) {
    this.lastElement.reply_markup = this.botInstance.keyboard.inline(data, isVertically);
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
    const botInstance       = this.botInstance,

          chatId            = this.botReqCtx.cid,
          inlineQueryId     = this.botReqCtx.qid,
          callbackQueryId   = this.botReqCtx.cqid;

    const queue             = this.queue,
          lastElement       = this.lastElement;

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

            if(chatId) {
                elem.chat_id = chatId;
            }

            if(callbackQueryId) {
                elem.callback_query_id = callbackQueryId;
            }

            if(inlineQueryId) {
                elem.inline_query_id = inlineQueryId;
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