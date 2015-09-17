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

var objBot          = rBot();
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

var objMyBot    = rBot(process.env.TG_BOT_TOKEN_MY),
    objOtherBot = rBot(process.env.TG_BOT_TOKEN_OTHER);

var objSrv = objBot.server(objSrvOptions);


objSrv
    .bot(objMyBot, "/myBot")
    .logger(cbMyBotLogger)

    .command("start", cbCmdStart)
    .command("stop", cbCmdStop);

objSrv
    .bot(objOtherBot, "/myOtherBot", cbMsg)
    .logger(cbOtherBotLogger)
    .analytics("apiKey", "appNameOtherBot");



function cbMyBotLogger(error, data) {
    console.log("cbMyBotLogger");
}

function cbOtherBotLogger(error, data) {
    console.log("cbOtherBotLogger");
}

function cbMsg(bot) {
    console.log("cbMsg");
    console.log(bot);

    //----------------]>

    var msg         = bot.message;

    var msgChat     = msg.chat,
        msgText     = msg.text;

    //----------------]>

    bot.api
        .getMe()
        .then(() => {
            bot.data.chatAction = "typing";
            return bot.send();
        })
        .then(() => {
            bot.data.text = "Use: /start";
            return bot.send();
        })
        .then(() => {
            bot.data.photo = "https://www.google.ru/images/logos/ps_logo2.png";
            return bot.send();
        })
        .then(() => {
            bot.to = msgText;
            return bot.forward();
        })
        .then(() => {
            bot.data.text = ">_>";
            return bot.send();
        })
        .then(JSON.parse)
        .then(console.log, console.error);
}

function cbCmdStart(bot, params) {
    console.log("cbCmdStart");
    console.log(bot);

    //----------------]>

    bot.data.text = "Hello";
    bot.send().then(JSON.parse).then(console.log, console.error);
}

function cbCmdStop(bot, params) {
    console.log("cbCmdStop");
    console.log(bot);

    //----------------]>

    bot.data = [
        {"text": params},
        {"photo": __dirname + "/MiElPotato.jpg", "caption": "#2EASY"}
    ];

    bot.send();
}