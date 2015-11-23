//-----------------------------------------------------
//
// Author: Daeren Torn
// Site: 666.io
//
//-----------------------------------------------------

"use strict";

//-----------------------------------------------------

const rChai     = require("chai");

const assert    = rChai.assert,
      expect    = rChai.expect;

const rBot      = require("./../index");

//-----------------------------------------------------

const objBot          = rBot();
const objSrvOptions   = {
    "certDir":   "/www/site",

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

const objMyBot      = rBot(process.env.TG_BOT_TOKEN_MY),
      objOtherBot   = rBot(process.env.TG_BOT_TOKEN_OTHER);

const objSrv = objBot.http(objSrvOptions);

//-----------]>

objMyBot.enable("onMsg.sanitize"); // <-- Sanitize Incoming message

objSrv
    .bot(objMyBot, "/myBot")
    .logger(cbBotLogger)

    .on("/start", cbCmdStart)
    .on("/stop", cbCmdStop);

objSrv
    .bot(objOtherBot, "/myOtherBot", cbMsg)
    .logger(cbBotLogger);

//-----------]>

function cbBotLogger(error, data) {
    if(error)
        expect(error).to.be.an.instanceof(Error);
    else {
        expect(error).to.be.null;
        expect(data).to.be.a("object");

        expect(data).to.have.property("update_id").that.is.an("number");
        expect(data).to.have.property("message").that.is.an("object");
    }
}

//--------)>

function cbMsg(bot, cmd) {
    if(cmd) {
        expect(cmd).to.be.a("object");

        expect(cmd).to.have.property("name");
        expect(cmd).to.have.property("text");
        expect(cmd).to.have.property("cmd");
    }

    //----------]>

    tCheckBaseBotFields(bot);

    //----------]>

    let msg         = bot.message;

    let msgChat     = msg.chat,
        msgText     = msg.text;

    //----------------]>

    bot.api
        .getMe()
        .then(() => {
            return bot.data().chatAction("typing").send();
        })
        .then(() => {
            return bot.data().text("Use: /start").send();
        })
        .then(() => {
            return bot.data().photo("https://www.google.ru/images/logos/ps_logo2.png").send();
        })
        .then(() => {
            bot.to = msgText;
            return bot.forward();
        })
        .then(() => {
            return bot.data().text("Forward: ok").send();
        })
        .then(console.log, console.error);
}

//--------)>

function cbCmdStart(bot, params) {
    tCheckBaseBotFields(bot);

    //----------]>

    bot.data().text("Hello").send().then(console.log, console.error);
}

function cbCmdStop(bot, params) {
    tCheckBaseBotFields(bot);

    //----------]>

    bot
        .data()
        .text(params)
        .photo(__dirname + "/MiElPotato.jpg").caption("#2EASY")
        .send();
}

//-------------]>

function tCheckBaseBotFields(bot) {
    expect(bot).to.be.a("object");
    expect(bot).to.have.property("message").that.is.an("object");

    //----------]>

    const msg = bot.message;

    expect(msg).to.have.property("message_id");
    expect(msg).to.have.property("from").that.is.an("object");
    expect(msg).to.have.property("chat").that.is.an("object");
    expect(msg).to.have.property("date");

    expect(bot).to.have.property("isGroup").that.is.an("boolean");
    expect(bot).to.have.property("cid").that.equal(msg.chat.id);
    expect(bot).to.have.property("mid").that.equal(msg.message_id);
    expect(bot).to.have.property("from").that.equal(msg.chat.id);

    //----------]>

    expect(bot).to.have.property("data").that.is.an("function");
    expect(bot).to.have.property("send").that.is.an("function");
    expect(bot).to.have.property("forward").that.is.an("function");
    expect(bot).to.have.property("render").that.is.an("function");
}