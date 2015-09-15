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
            .analytics("apiKey", "appName")
            .command("stop", cbCmdStop);
    }, console.error);

function cbMsg(data) {
    this.data.message = data;
    this.send();
}

function cbCmdStop(data, params) {
    this.data.message = "cbCmdStop";
    this.send();

    objSrv.stop();
}