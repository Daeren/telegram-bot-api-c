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

    "http":     false, //_ nginx + nodejs = <3
    "host":     "site.xx"
};

//------------------]>

objBot
    .webhook("site.xx/myBot")
    .then(JSON.parse)
    .then(response => {
        if(!response.ok)
            throw new Error("Oops...problems with webhook...");

        objBot
            .createServer(gSrvOptions, cbMsg)
            .command("feedback", cbCmdFeedback);
    });

//------------------]>

function cbMsg(data) {
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
        })
        .then(() => {
            this.data.photo = __dirname + "/MiElPotato.jpg";
            return this.send();
        })
        .then(() => {
            this.mid = msg.message_id;
            this.from = msgChat.id;
            this.to = msgText;

            return this.forward();

        })
        .then(() => {
            this.data.message = ">_>";
            return this.send();
        })
        .then(JSON.parse)
        .then(console.log, console.error);
}

function cbCmdFeedback(data, params) {
    var msg         = data.message;
    var msgChat     = msg.chat;

    //----------------]>

    this.id = msgChat.id;
    this.data.message = params;

    this.send();
}