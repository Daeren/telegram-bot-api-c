//-----------------------------------------------------
//
// Author: Daeren
// Site: 666.io
//
//-----------------------------------------------------

"use strict";

//-----------------------------------------------------

const rUtil                         = require("./../../util");

const onIncomingMessage             = require("./onIncomingMessage"),
      onIncomingInlineQuery         = require("./onIncomingInlineQuery"),
      onIncomingCallbackQuery       = require("./onIncomingCallbackQuery"),
      onIncomingChosenInlineResult  = require("./onIncomingChosenInlineResult");

//-----------------------------------------------------

const gUpdatesFields    = ["inline_query", "message", "callback_query", "chosen_inline_result"];
const gIncomeEvList     = [onIncomingInlineQuery, onIncomingMessage, onIncomingCallbackQuery, onIncomingChosenInlineResult];

//-----------------------------------------------------

module.exports = main;

//-----------------------------------------------------

function main(srvBot, data) {
    if(data && typeof(data) === "object") {
        for(let input, i = 0, len = gUpdatesFields.length; i < len; i++) {
            input = data[gUpdatesFields[i]];

            if(input && typeof(input) === "object") {
                gIncomeEvList[i](srvBot, input, onEnd);
                break;
            }
        }
    }

    //--------]>

    function onEnd(error, reqCtx, gotoState) {
        if(error) {
            onError(error);
        }
        else if(reqCtx) {
            onDefault();
        }

        //-------]>

        function onDefault() {
            let onMsg = srvBot.onMsg;

            if(onMsg) {
                try {
                    onMsg = onMsg(reqCtx, gotoState);
                } catch(e) {
                    onError(e);
                }

                rUtil.executeGenerator(onMsg, onError);
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
}