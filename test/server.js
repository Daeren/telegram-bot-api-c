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
    "certDir":  "J:/WebServers/NodeJS/www/db.gg/SSL",

    "key":       "/3_db.gg.key",
    "cert":      "/2_db.gg.crt",
    "ca":       [
        "/AddTrustExternalCARoot.crt",
        "/COMODORSAAddTrustCA.crt",
        "/COMODORSADomainValidationSecureServerCA.crt"
    ],

    "host":     "db.gg"
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