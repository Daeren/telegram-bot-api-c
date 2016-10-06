//-----------------------------------------------------
//
// Author: Daeren
// Site: 666.io
//
//-----------------------------------------------------

/*jshint expr: true*/

"use strict";

//-----------------------------------------------------

const rChai     = require("chai");

const expect    = rChai.expect;

const rBot      = require("./../index");

//-----------------------------------------------------

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

const objBot        = rBot();

const objMyBot      = rBot(process.env.TG_BOT_TOKEN_MY),
      objOtherBot   = rBot(process.env.TG_BOT_TOKEN_OTHER);

const objSrv        = objBot.http(objSrvOptions);

//-----------]>

objSrv
    .bot(objMyBot, "/myBot")

    .on("/start", cbCmdStart)
    .on("/stop", cbCmdStop);

objSrv
    .bot(objOtherBot, "/myOtherBot", cbMsg);

//-----------]>

function cbMsg(bot) {
    const cmd = bot.command;

    if(cmd) {
        expect(cmd).to.be.a("object");

        expect(cmd).to.have.property("name");
        expect(cmd).to.have.property("text");
        expect(cmd).to.have.property("cmd");
    }

    //----------]>

    tCheckBaseBotFields(bot);

    //----------------]>

    bot.api
        .getMe()
        .then(() => {
            return bot.answer().chatAction("typing").send();
        })
        .then(() => {
            return bot.answer().text("Use: /start").send();
        })
        .then(() => {
            return bot.answer().photo("https://www.google.ru/images/logos/ps_logo2.png").send();
        })
        .then(() => {
            return bot.answer().text("Forward: ok").send();
        })
        .then(console.log, console.error);
}

//--------)>

function cbCmdStart(bot, params) {
    tCheckBaseBotFields(bot);

    expect(params).to.be.an("object");
	
    //----------]>

    bot.answer().text("Hello").send().then(console.log, console.error);
}

function cbCmdStop(bot, params) {
    tCheckBaseBotFields(bot);

    //----------]>

    bot
        .answer()
        .text(params)
        .photo(__dirname + "/MiElPotato.jpg").caption("#2EASY")
        .send();
}

//-------------]>

function tCheckBaseBotFields(bot) {
    expect(bot).to.be.an("object");
    expect(bot).to.have.property("message").that.is.an("object");

    //----------]>

    const msg = bot.message;

    expect(msg).to.have.property("message_id");
    expect(msg).to.have.property("from").that.is.an("object");
    expect(msg).to.have.property("chat").that.is.an("object");
    expect(msg).to.have.property("date");

    expect(bot).to.have.property("isGroup").that.is.an("boolean");
    expect(bot).to.have.property("isReply").that.is.an("boolean");

    expect(bot).to.have.property("cid").that.equal(msg.chat.id);
    expect(bot).to.have.property("mid").that.equal(msg.message_id);

    //----------]>

    expect(bot).to.have.property("answer").that.is.an("function");
    expect(bot).to.have.property("render").that.is.an("function");
}