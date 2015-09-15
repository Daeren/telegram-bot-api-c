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

var objBot = rBot();
var objSrvOptions  = {
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

var objMyBot    = rBot(process.env.TG_BOT_TOKEN_MY),
    objOtherBot = rBot(process.env.TG_BOT_TOKEN_OTHER);

var objSrv = objBot.server(objSrvOptions);


objSrv
    .bot(objMyBot, "/myBot")

    .command("start", cbCmdStart)
    .command("stop", cbCmdStop);

objSrv
    .bot(objOtherBot, "/myOtherBot", cbMsg)
    .analytics("apiKey", "appNameOtherBot");


function cbMsg(data) {
    console.log("cbMsg");
    console.log(data);

    //----------------]>

    var msg         = data.message;

    var msgChat     = msg.chat,
        msgText     = msg.text;

    //----------------]>

    // this.id = msgChat.id; <-- Default: chat_id in message

    this.api
        .getMe()
        .then(() => {
            this.data.chatAction = "typing";
            return this.send();
        })
        .then(() => {
            this.data.message = "Use: /start";
            return this.send();
        })
        .then(() => {
            this.data.photo = "https://www.google.ru/images/logos/ps_logo2.png";
            return this.send();
        })
        .then(() => {
            // this.mid = msg.message_id; <-- Default: message_id in message
            // this.from = msgChat.id; <-- Default: chat_id in message

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

function cbCmdStart(data, params) {
    console.log("cbCmdStart");
    console.log(data);

    //----------------]>

    this.data.message = "Hello";
    this.send().then(JSON.parse).then(console.log, console.error);
}

function cbCmdStop(data, params) {
    console.log("cbCmdStop");
    console.log(data);

    //----------------]>

    this.data = [
        {"message": params},
        {"photo": __dirname + "/MiElPotato.jpg", "caption": "#2EASY"}
    ];

    this.send();
}