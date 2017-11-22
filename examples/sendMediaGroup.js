//-----------------------------------------------------
//
// Author: Daeren
// Site: 666.io
//
//-----------------------------------------------------

/*jshint expr: true*/

"use strict";

//-----------------------------------------------------

const rBot      = require("./../index");

//-----------------------------------------------------

const token     = process.env.TELEGRAM_BOT_TOKEN,
      chatId    = process.env.TELEGRAM_CHAT_ID;

const bot = rBot(token);

//-----------------------------------------------------

bot.enable("tgUrlUpload");

bot.api.sendMediaGroup({
    "chat_id": chatId,
    "media": [
        {
            "type": "photo",
            "media": "https://www.google.ru/images/logos/ps_logo2.png"
        },
        { // recommended
            "type": "photo",
            "media": "AgADAgAD1qcxG2_R8AbjPe6-AjgFdozGWSoABAE2Gi-3QnhSD7wBAAEC"
        }
    ]
}, function(error, data) {
    console.log(error, data);
});