//-----------------------------------------------------
//
// Author: Daeren
// Site: 666.io
//
//-----------------------------------------------------

"use strict";

//-----------------------------------------------------

const rUtil                         = require("./../../util"),
      rErrors                       = require("./../../errors");

const onIncomingMessage             = require("./onIncomingMessage"),

      onIncomingShippingQuery       = require("./onIncomingShippingQuery"),
      onIncomingPreCheckoutQuery    = require("./onIncomingPreCheckoutQuery"),

      onIncomingInlineQuery         = require("./onIncomingInlineQuery"),
      onIncomingCallbackQuery       = require("./onIncomingCallbackQuery"),

      onIncomingChosenInlineResult  = require("./onIncomingChosenInlineResult");

//-----------------------------------------------------

const gIncomeEv = [
    ["message",                 "message",              onIncomingMessage],
    ["edited_message",          "editedMessage",        onIncomingMessage],
    ["channel_post",            "channelPost",          onIncomingMessage],
    ["edited_channel_post",     "editedChannelPost",    onIncomingMessage],

    ["inline_query",            "inlineQuery",          onIncomingInlineQuery],
    ["callback_query",          "callbackQuery",        onIncomingCallbackQuery],

    ["shipping_query",          "shippingQuery",        onIncomingShippingQuery],
    ["pre_checkout_query",      "preCheckoutQuery",     onIncomingPreCheckoutQuery],

    ["chosen_inline_result",    "chosenInlineResult",   onIncomingChosenInlineResult]
];

//-----------------------------------------------------

module.exports = main;

//-----------------------------------------------------

function main(error, srvBot, data) {
    if(!error && (!data || typeof(data) !== "object")) {
        error = new Error("Expected [Object].");

        error.code = rErrors.ERR_FAILED_PARSE_DATA;
        error.data = data;
    }

    if(error) {
        onError(error);
        return;
    }

    //--------]>

    for(let ctx, ev, updateType, eventType, func, input, i = 0, len = gIncomeEv.length; i < len; i++) {
        ev = gIncomeEv[i];

        updateType = ev[0];
        input = data[updateType];

        if(input && typeof(input) === "object") {
            eventType = ev[1];
            func = ev[2];

            ctx = Object.create(srvBot.ctx);

            //---------]>

            ctx.updateType = updateType;
            ctx.updateSubType = null;

            ctx.eventType = eventType;
            ctx.eventSubType = null;

            ctx.from = input.from;

            ctx[eventType] = input;

            //---------]>

            func(ctx, srvBot.plugins, srvBot.events, updateType, eventType, input, onEnd);

            break;
        }
    }

    //--------]>

    function onEnd(error, reqCtx) {
        if(error) {
            onError(error);
        }
        else {
            let onMsg = srvBot.onMsg;

            if(onMsg) {
                try {
                    onMsg = onMsg(reqCtx);
                } catch(e) {
                    onError(e);
                }

                rUtil.executeGenerator(onMsg, onError);
            }
        }
    }

    function onError(error) {
        if(error) {
            let cbCatch = srvBot.cbCatch;

            if(cbCatch) {
                cbCatch = cbCatch(error);
                rUtil.executeGenerator(cbCatch);
            }
            else {
                throw error;
            }
        }
    }
}