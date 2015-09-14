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

var objBotServer    = new rBot(process.env.TELEGRAM_BOT_TOKEN);
var gBotSrvOptions  = {
    "certDir":  "/www/site",

    "key":       "/3_site.xx.key",
    "cert":      "/2_site.xx.crt",
    "ca":       [
        "/AddTrustExternalCARoot.crt",
        "/COMODORSAAddTrustCA.crt",
        "/COMODORSADomainValidationSecureServerCA.crt"
    ],

    "http":     false, //_ nginx + nodejs = <3
    "host":     "site.xx"
};

//------------------]>

objBotServer
    .webhook("site.xx/myBot")

    .then(JSON.parse)
    .then(response => {
        if(!response.ok)
            throw new Error("Oops...problems with webhook...");

        objBotServer
            .createServer(gBotSrvOptions, cbMsg)
            .command("feedback", cbCmdFeedback);
    });

//------------------]>

function cbMsg(data) {
    this.id = data.message.chat.id;
    this.data.message = "cbMsg";
    this.send();
}

function cbCmdFeedback(data, params) {
    this.id = data.message.chat.id;
    this.data.message = params;
    this.send();
}