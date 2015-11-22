//-----------------------------------------------------
//
// Author: Daeren Torn
// Site: 666.io
//
//-----------------------------------------------------

"use strict";

//-----------------------------------------------------

const rChai     = require("chai");

const assert    = rChai.assert,
      expect    = rChai.expect;

const rBot      = require("./../index");

//-----------------------------------------------------

const objBot    = rBot(process.env.TELEGRAM_BOT_TOKEN);
const objSrv    = objBot
    .virtual(bot => {
        bot.data().text("Not found!").send();
    })
    .on(/./, console.log)
    .on("photo", console.log);

//-----------------------------------------------------

objBot
    .api
    .setWebhook({"url": "site.xx/dev-bot"})
    .then(isOk => {
        if(!isOk)
            throw new Error("Oops...problems with webhook...");

        //-------]>

        const rExpress      = require("express"),
              rBodyParser   = require("body-parser");

        rExpress()
            .use(rBodyParser.json())
            .post("/dev-bot", objSrv.middleware)
            .listen(1490, "localhost");
    }).catch(console.error);

//-------[Input]-------}>

setInterval(function() {
    objSrv.input(null, {
        "update_id": 0,
        "message": {
            "message_id": 0,

            "from": {
                "id": 59725308, "first_name": "Daeren", "username": "io666"
            },

            "chat": {
                "id": 59725308,
                "first_name": "Daeren",
                "username": "io666",
                "type": "private"
            },

            "date": 0,
            "text": 0
        }
    });
}, 2000);
