//-----------------------------------------------------
//
// Author: Daeren Torn
// Site: 666.io
//
//-----------------------------------------------------

"use strict";

//-----------------------------------------------------

var rBot = require("./../index");

//-----------------------------------------------------

var objSrv;

var objBot      = rBot(process.env.TELEGRAM_BOT_TOKEN);
var objOptions  = {
    "limit":    100,
    "timeout":  0,
    "interval": 1
};

objBot.api
    .setWebhook()
    .then(x => {

        objSrv = objBot.polling(objOptions, rspNotFound);

        //---------]>

        objSrv.on("/start", rspCmdStart);
        objSrv.on("/", rspCmdNotFound);

        objSrv.on(/^id\s+(\d+)/i, rspTextRegExp)

        //objSrv.on(["photo", "document"], rspDocument);

        objSrv.on("text", rspText);
        objSrv.on("photo", rspPhoto);
        objSrv.on("audio", rspAudio);
        objSrv.on("document", rspDocument);
        objSrv.on("sticker", rspSticker);
        objSrv.on("video", rspVideo);
        objSrv.on("voice", rspVoice);
        objSrv.on("contact", rspContact);
        objSrv.on("location", rspLocation);

        //objSrv.off(/^hello/i, rspTextRegExp);

        //---------]>

        function rspNotFound(bot, cmdParams) {
            response("rspNotFound:", bot, cmdParams);
        }


        function rspCmdNotFound(bot, cmdParams) {
            response("rspCmdNotFound:", bot, cmdParams);
        }

        function rspCmdStart(bot, cmdParams) {
            response("rspCmdStart:", bot, cmdParams);

        }


        function rspTextRegExp(bot, reParams) {
            response("rspTextRegExp:", bot, reParams);
        }


        function rspText(bot) {
            response("rspText:", bot);

        }

        function rspPhoto(bot) {
            response("rspPhoto:", bot)
        }

        function rspAudio(bot) {
            response("audio:", bot);
        }

        function rspDocument(bot) {
            response("document:", bot);
        }

        function rspSticker(bot) {
            response("sticker:", bot);
        }

        function rspVideo(bot) {
            response("video:", bot);
        }

        function rspVoice(bot) {
            response("voice:", bot);
        }

        function rspContact(bot) {
            response("contact:", bot);
        }

        function rspLocation(bot) {
            response("location:", bot);
        }

        //---------]>

        function response(who, bot, params) {
            console.log(who);
            console.log(params);

            bot.data.text = bot;
            bot.send();
        }
    }, console.error);





return;




objBot.api
    .setWebhook()
    .then(x => {
        objSrv = objBot
            .polling(objOptions, cbMsg)
            .logger(cbLogger)
            .analytics("apiKey", "appName")
            .on("/stop", cbCmdStop);
    }, console.error);


function cbLogger(error, data) {
    console.log(error, data && data.toString());
}

function cbMsg(bot) {
    bot.data.text = bot.message;
    bot.data.reply_markup = bot.keyboard[bot.message.text];

    // vOx, hOx, vPn, hPn, vLr, hLr, vGb, hGb
    // numpad, hide

    // vOxOnce, hOxOnce, vPnOnce, hPnOnce, vLrOnce, hLrOnce, vGbOnce, hGbOnce
    // numpadOnce

    bot.send();
}

function cbCmdStop(bot, params) {
    bot.data.text = "cbCmdStop";
    bot.send();

    objSrv.stop();
}