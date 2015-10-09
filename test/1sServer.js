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

        objSrv = objBot.polling(objOptions, onNotFound);

        //---------]>

        objSrv.on("/start", onCmdStart);
        objSrv.on("/", onCmdNotFound);

        objSrv.on(/^id\s+(\d+)/i, onTextRegExp);

        //objSrv.on(["photo", "document"], onDocument);

        objSrv.on("enterChat", onEnterChat);
        objSrv.on("leftChat", onLeftChat);

        objSrv.on("text", onText);
        objSrv.on("photo", onPhoto);
        objSrv.on("audio", onAudio);
        objSrv.on("document", onDocument);
        objSrv.on("sticker", onSticker);
        objSrv.on("video", onVideo);
        objSrv.on("voice", onVoice);
        objSrv.on("contact", onContact);
        objSrv.on("location", onLocation);

        //objSrv.off(/^hello/i, onTextRegExp);

        //---------]>

        function onNotFound(bot, cmdParams) {
            response("onNotFound:", bot, cmdParams);
        }


        function onCmdNotFound(bot, cmdParams) {
            response("onCmdNotFound:", bot, cmdParams);
        }

        function onCmdStart(bot, cmdParams) {
            response("onCmdStart:", bot, cmdParams);

        }


        function onTextRegExp(bot, reParams) {
            response("onTextRegExp:", bot, reParams);
        }


        function onEnterChat(bot) {
            response("onEnterChat:", bot);
        }

        function onLeftChat(bot) {
            response("onLeftChat:", bot);
        }


        function onText(bot) {
            response("onText:", bot);

            var msgText = bot.message.text;

            bot.data.text = bot.message;
            //bot.data.reply_markup = bot.keyboard[msgText];
            bot.data.reply_markup = bot.keyboard([["1", "2,", "3"]], msgText);

            // "resize once selective"

            // vOx, hOx, vPn, hPn, vLr, hLr, vGb, hGb
            // numpad, hide

            // vOxOnce, hOxOnce, vPnOnce, hPnOnce, vLrOnce, hLrOnce, vGbOnce, hGbOnce
            // numpadOnce

            bot.send();
        }

        function onPhoto(bot) {
            response("onPhoto:", bot)
        }

        function onAudio(bot) {
            response("audio:", bot);
        }

        function onDocument(bot) {
            response("document:", bot);
        }

        function onSticker(bot) {
            response("sticker:", bot);
        }

        function onVideo(bot) {
            response("video:", bot);
        }

        function onVoice(bot) {
            response("voice:", bot);
        }

        function onContact(bot) {
            response("contact:", bot);
        }

        function onLocation(bot) {
            response("location:", bot);
        }

        //---------]>

        function response(who, bot, params) {
            console.log(who);
            console.log(bot);
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