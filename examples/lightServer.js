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

const objBot            = rBot(process.env.TELEGRAM_BOT_TOKEN);
const objSrvOptions     = {
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

objBot
    .api
    .setWebhook({"url": "https://site.xx/botX"})

    .then(isOk => {
        expect(isOk).to.be.a("boolean");

        if(!isOk) {
            throw new Error("Oops...problems with webhook...");
        }

        objBot
            .http(objSrvOptions, cbMsg)
            .on("/start", cbCmdStart);
    }, function(error) {
        expect(error).to.be.an.instanceof(Error);

        console.error(error);
    });

//------------------]>

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

    //----------]>

    let commands = {
        "help": x => bot.answer().text(x).send()
    };

    let cmdFunc,
        cmdParams = bot.parseCmd(bot.message.text);

    if(cmdParams) {
        (cmdFunc = commands[cmdParams.name]) ? cmdFunc(cmdParams) : console.log(cmdParams);
    }

    //--------------]>

    bot.answer().text("Hell Word!").send();
}

function cbCmdStart(bot, params) {
    tCheckBaseBotFields(bot);

    expect(params).to.be.an("object");
	
    //----------]>

    bot.answer().text("CMD: /start").send();
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
    expect(bot).to.have.property("isReply").that.is.an("boolean");

    expect(bot).to.have.property("cid").that.equal(msg.chat.id);
    expect(bot).to.have.property("mid").that.equal(msg.message_id);

    //----------]>

    expect(bot).to.have.property("answer").that.is.an("function");
}