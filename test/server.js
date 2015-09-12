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

var objBot  = new rBot(process.env.TELEGRAM_BOT_TOKEN);

var gSrvOptions = {
    "certDir":  "/www/site",

    "key":       "/3_site.xx.key",
    "cert":      "/2_site.xx.crt",
    "ca":       [
        "/AddTrustExternalCARoot.crt",
        "/COMODORSAAddTrustCA.crt",
        "/COMODORSADomainValidationSecureServerCA.crt"
    ],

    "host":     "site.xx"
};

//------------------]>

objBot
    .createServer(gSrvOptions, cbServer)
    .command("feedback", cbCmdFeedback);

//------------------]>

function cbServer(data) {
    var msg         = data.message;

    var msgFrom     = msg.from,
        msgChat     = msg.chat,

        msgText     = msg.text,
        msgDate     = msg.date;

    //----------------]>

    objBot.send(msgChat.id, {"message": "Use: /feedback"});
}

function cbCmdFeedback(data, params) {
    var msg         = data.message;
    var msgChat     = msg.chat;

    //----------------]>

    objBot.send(msgChat.id, {"message": "I'm feedback!"});
}