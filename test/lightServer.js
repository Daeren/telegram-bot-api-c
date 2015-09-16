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

var objBot          = rBot(process.env.TELEGRAM_BOT_TOKEN);
var objSrvOptions   = {
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

objBot.api
    .setWebhook({"url": "site.xx/myBot"})

    .then(JSON.parse)
    .then(response => {
        if(!response.ok)
            throw new Error("Oops...problems with webhook...");

    }, console.error);


objBot
    .server(objSrvOptions, cbMsg)
    .logger(cbLogger)
    .command("start", cbCmdStart);

//------------------]>

function cbLogger(error, data) {
    console.log("LOG: ", error, data && data.toString());
}

function cbMsg(data) {
    var commands = {
        "help": x => {
            this.data.message = x;
            this.send();
        }
    };

    var cmdFunc,
        cmdParams = this.parseCmd(data.message.text);

    if(cmdParams)
         (cmdFunc = commands[cmdParams.name]) ? cmdFunc(cmdParams) : console.log(cmdParams);

    //--------------]>

    this.id = data.message.chat.id;
    this.data.message = "Hell Word!";
    this.send();
}

function cbCmdStart(data, params) {
    this.id = data.message.chat.id;
    this.data.message = params;
    this.send();
}