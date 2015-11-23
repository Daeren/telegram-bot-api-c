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
    .setWebhook({"url": "site.xx/botX"})

    .then(isOk => {
        expect(isOk).to.be.a("boolean");

        if(!isOk) {
            throw new Error("Oops...problems with webhook...");
        }

        objBot
            .http(objSrvOptions, cbMsg)
            .logger(cbLogger)

            .on("/start", cbCmdStart);
    }, function(error) {
        expect(error).to.be.an.instanceof(Error);

        console.error(error);
    });

//------------------]>

function cbLogger(error, data) {
    if(error) {
        expect(error).to.be.an.instanceof(Error);
    }
    else {
        expect(error).to.be.null;
        expect(data).to.be.a("object");

        expect(data).to.have.property("update_id").that.is.an("number");
        expect(data).to.have.property("message").that.is.an("object");
    }
}

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

    let commands = {
        "help": x => bot.data().text(x).send()
    };

    let cmdFunc,
        cmdParams = bot.parseCmd(bot.message.text);

    if(cmdParams) {
        (cmdFunc = commands[cmdParams.name]) ? cmdFunc(cmdParams) : console.log(cmdParams);
    }

    //--------------]>

    bot.data().text("Hell Word!").send();
}

function cbCmdStart(bot, params) {
    tCheckBaseBotFields(bot);

    //----------]>

    bot.data().text("CMD: /start").send();
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

    expect(bot).to.have.property("cid").that.equal(msg.chat.id);
    expect(bot).to.have.property("mid").that.equal(msg.message_id);
    expect(bot).to.have.property("from").that.equal(msg.chat.id);

    //----------]>

    expect(bot).to.have.property("data").that.is.an("function");
    expect(bot).to.have.property("send").that.is.an("function");
    expect(bot).to.have.property("forward").that.is.an("function");
}