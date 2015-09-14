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

var objMyBot    = new rBot(process.env.TELEGRAM_BOT_TOKEN_MY),
    objOtherBot = new rBot(process.env.TELEGRAM_BOT_TOKEN_OTHER);

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

    this.id = msgChat.id;

    this.api.getMe()
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

            return this.forward()
                .then(JSON.parse)
                .then(console.log, console.error);

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

    this.id = data.message.chat.id;
    this.data.message = "Hello";

    this.send().then(JSON.parse).then(console.log, console.error);
}

function cbCmdStop(data, params) {
    console.log("cbCmdStop");
    console.log(data);

    //----------------]>

    this.id = data.message.chat.id;
    this.data.message = params;

    this.send();
}