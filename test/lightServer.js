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
    .then(isOk => {
        if(!isOk)
            throw new Error("Oops...problems with webhook...");

        objBot
            .server(objSrvOptions, cbMsg)
            .logger(cbLogger)
            .on("/start", cbCmdStart);
    }, console.error);



//------------------]>

function cbLogger(error, data) {
    console.log("LOG: ", error, data && data.toString());
}

function cbMsg(bot) {
    var commands = {
        "help": x => {
            bot.data.text = x;
            bot.send();
        }
    };

    var cmdFunc,
        cmdParams = bot.parseCmd(bot.message.text);

    if(cmdParams)
         (cmdFunc = commands[cmdParams.name]) ? cmdFunc(cmdParams) : console.log(cmdParams);

    //--------------]>

    bot.data.text = "Hell Word!";
    bot.send();
}

function cbCmdStart(bot, params) {
    bot.data.text = params;
    bot.send();
}