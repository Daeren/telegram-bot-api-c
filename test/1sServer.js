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
        objSrv = objBot
            .polling(objOptions, cbMsg)
            .logger(cbLogger)
            .analytics("apiKey", "appName")
            .command("stop", cbCmdStop);
    }, console.error);


function cbLogger(error, data) {
    console.log(error, data && data.toString());
}

function cbMsg(data) {
    this.data.message = data;
    this.data.reply_markup = this.keyboard[data.message.text];

    // vOx, hOx, vPn, hPn, vLr, hLr, vGb, hGb
    // numpad, hide

    // vOxOnce, hOxOnce, vPnOnce, hPnOnce, vLrOnce, hLrOnce, vGbOnce, hGbOnce
    // numpadOnce

    this.send();
}

function cbCmdStop(data, params) {
    this.data.message = "cbCmdStop";
    this.send();

    objSrv.stop();
}