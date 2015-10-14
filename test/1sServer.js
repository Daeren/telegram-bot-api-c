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

var reText = /^id\s+(\d+)/i;

//---------]>

objSrv = objBot.polling(objOptions);

objSrv.on(/^empty/i, onTextRegExp);
objSrv.on(/^hello/i, ["type", "id"], onTextRegExp);
objSrv.on(/^(id)\s+(\d+)/i, ["type", "id"], onTextRegExp);
objSrv.on(/^(login)\s+(\w+)/i, ["type", "login"], onTextRegExp);

function onTextRegExp(bot, reParams) {
    response("onTextRegExp:", bot, reParams);
}

function response(who, bot, params) {
    console.log(who);
    console.log("bot: ", bot);
    console.log("params: ", params);

    bot.data.text = bot;
    bot.send();
}






return;






//-----------------------]>

objBot
    .api
    .setWebhook()

    .then(x => {
        var reText = /^id\s+(\d+)/i;

        //---------]>

        objSrv = objBot.polling(objOptions, onNotFound);


        objSrv.on(reText, ["type", "id"], onTextRegExp);
        objSrv.on(reText, ["type", "id"], onTextRegExp);
        objSrv.on(reText, ["type", "id"], onTextRegExp);

        objSrv.off(reText, ["type", "id"], onTextRegExp);

        objSrv.on(reText, ["type", "id"], onTextRegExp);

        return;

        //---------]>

        objSrv.on("/start", onCmdStart);
        objSrv.on("/", onCmdNotFound);

        objSrv.on(/^(id)\s+(\d+)/i, ["type", "id"], onTextRegExp);
        objSrv.on(/^(num)\s+(\d+)/i, ["type", "num"], onTextRegExp);

        //objSrv.on(reText, onTextRegExp);
        //objSrv.off(reText, onTextRegExp);
        //objSrv.on(/^id\s+(\d+)/i, onTextRegExp);
        //objSrv.off(/^id\s+(\d+)/i, onTextRegExp);

        //objSrv.on(["photo", "document"], onDocument);

        objSrv.on("enterChat", onEnterChat);
        objSrv.on("leftChat", onLeftChat);

        objSrv.on("chatTitle", onChatTitle);
        objSrv.on("chatNewPhoto", onChatNewPhoto);
        objSrv.on("chatDeletePhoto", onChatDeletePhoto);
        objSrv.on("chatCreated", onChatCreated);

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


        function onEnterChat(bot, data) {
            response("onEnterChat:", bot, data);
        }

        function onLeftChat(bot, data) {
            response("onLeftChat:", bot, data);
        }


        function onChatTitle(bot, data) {
            response("onChatTitle:", bot, data);
        }

        function onChatNewPhoto(bot, data) {
            response("onChatNewPhoto:", bot, data);
        }

        function onChatDeletePhoto(bot, data) {
            response("onChatDeletePhoto:", bot, data);
        }

        function onChatCreated(bot, data) {
            response("onChatCreated:", bot, data);
        }


        function onText(bot, data) {
            response("onText:", bot, data);

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

        function onPhoto(bot, data) {
            response("onPhoto:", bot, data)
        }

        function onAudio(bot, data) {
            response("audio:", bot, data);
        }

        function onDocument(bot, data) {
            response("document:", bot, data);
        }

        function onSticker(bot, data) {
            response("sticker:", bot, data);
        }

        function onVideo(bot, data) {
            response("video:", bot, data);
        }

        function onVoice(bot, data) {
            response("voice:", bot, data);
        }

        function onContact(bot, data) {
            response("contact:", bot, data);
        }

        function onLocation(bot, data) {
            response("location:", bot, data);
        }

        //---------]>

        function response(who, bot, params) {
            console.log(who);
            console.log("bot: ", bot);
            console.log("params: ", params);

            bot.data.text = bot;
            bot.send();
        }
    })
    .catch(console.error);





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