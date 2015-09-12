﻿//-----------------------------------------------------
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

    this.id = msgChat.id;

    this.i()
        .then(() => {
            this.data.chatAction = "typing";
            return this.send();
        })
        .then(() => {
            this.data.message = "Use: /feedback";
            return this.send();
        });
}

function cbCmdFeedback(data, params) {
    var msg         = data.message;
    var msgChat     = msg.chat;

    //----------------]>

    this.id = msgChat.id;
    this.data.message = "I'm feedback!";

    this.send();
}