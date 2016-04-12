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
    "caption", "duration", "performer", "title",

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

(function createElements(sendMethodsAliases) {
    for(let alias in sendMethodsAliases) {
        if(hasOwnProperty.call(sendMethodsAliases, alias)) {
            addElementMethod(alias, sendMethodsAliases[alias]);
        }
    }

    function addElementMethod(alias, original) {
        const baseElementField  = getBaseElementField(alias),
              baseDataField     = getBaseDataField(alias);

        CMain.prototype[baseElementField] = function(input, params) {
            const lastElement   = this.lastElement,
                  elem          = params ? Object.create(params) : {};

            //--------]>

            elem.__method__ = original;

            if(input !== null && typeof(input) !== "undefined" && !dataModifier(baseDataField, input, elem)) {
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

    function getBaseElementField(method) {
        switch(method) {
            case "message": return "text";

            default:        return method;
        }
    }

    function getBaseDataField(method) {
        switch(method) {
            case "message":     return "text";
            case "contact":     return "phone_number";
            case "chatAction":  return "action";

            default:            return method;
        }
    }

    function dataModifier(name, input, output) {
        switch(typeof(input)) {
            case "string":
                switch(name) {
                    case "location":
                    case "venue":
                        input = input.split(/\s+/);

                        output.latitude = input[0];
                        output.longitude = input[1];

                        return true;
                }

                break;

            case "object":
                switch(name) {
                    case "location":
                    case "venue":
                        if(Array.isArray(input)) {
                            output.latitude = input[0];
                            output.longitude = input[1];
                        }
                        else if(input) {
                            output.latitude = input.latitude;
                            output.longitude = input.longitude;
                        }

                        return true;
                }

                break;
        }

        return false;
    }
})(rAPIProto.sendMethodsAliases);

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
          lastElement   = this.lastElement;

    const chatId        = this.botReqCtx.cid;

    let queue           = this.queue;

    //-------]>

    if(queue) {
        queue.push(lastElement);
        this.queue = null;
    }
    else {
        queue = [lastElement];
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

        rUtil.forEachAsync(queue, iterElements, endIterElemnts);

        //-----]>

        function iterElements(next, e) {
            const apiMethod = botInstance.api[e.__method__];

            if(!e.chat_id) {
                e.chat_id = chatId;
            }

            apiMethod(e, next);
        }

        function endIterElemnts(error, result, index) {
            if(error) {
                callback(error, index);
            }
            else {
                callback(null, result);
            }
        }
    }
};