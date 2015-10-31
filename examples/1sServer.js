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

const objBot      = rBot(process.env.TELEGRAM_BOT_TOKEN);
const objOptions  = {
    "limit":    100,
    "timeout":  0,
    "interval": 1
};

let objSrv;

//---------]>

objSrv = objBot
    .polling(objOptions, onNotFound)
    .logger(function cbLogger(error, data) {
        if(error)
            expect(error).to.be.an.instanceof(Error);
        else {
            expect(error).to.be.null;
            expect(data).to.be.a("object");

            expect(data).to.have.property("ok");
            expect(data).to.have.property("result");
        }
    });

//-----[TEST]-----}>

expect(objSrv).to.be.a("object");
expect(objSrv).to.have.property("start").that.is.an("function");
expect(objSrv).to.have.property("stop").that.is.an("function");

//-----[PLUGIN]-----}>

objSrv
    .use(function(type, bot, next) {
        expect(type).to.be.a("string");
        expect(bot).to.be.a("object");
        expect(next).to.be.a("function");

        //----------]>

        tCheckBaseBotFields(bot);

        //----------]>

        console.log("1 | Type: %s", type);

        //if(bot.message.text === "next")
        next();
    })
    .use(function(type, bot, next) {
        expect(type).to.be.a("string");
        expect(bot).to.be.a("object");
        expect(next).to.be.a("function");

        //----------]>

        tCheckBaseBotFields(bot);

        //----------]>

        console.log("2 | Type: %s", type);
        next();
    });

//-----[EVENTS]-----}>

[
    "/start", "/",
    "enterChat", "leftChat",

    "chatTitle", "chatNewPhoto", "chatDeletePhoto", "chatCreated",

    "text", "photo", "audio", "document", "sticker", "video", "voice", "contact", "location",

    /^empty/i
]
    .forEach(function(type) {
        objSrv.on(type, function(bot, cmdParams) {
            response(type, bot, cmdParams);
        });
    });

objSrv.on("/stop", cbCmdStop);

objSrv
    .on(/^hello/i, ["type", "id"], onTextRegExp)
    .on(/^(id)\s+(\d+)/i, "type id", onTextRegExp)
    .on(/^(login)\s+(\w+)/i, ["type", "login"], onTextRegExp);


//------]>

function onNotFound(bot, cmd) {
    if(cmd) {
        expect(cmd).to.be.a("object");

        expect(cmd).to.have.property("name");
        expect(cmd).to.have.property("text");
        expect(cmd).to.have.property("cmd");
    }

    //----------]>

    response("onNotFound", bot, cmd);
}

function cbCmdStop(bot, cmdParams) {
    response("cbCmdStop", bot, cmdParams);

    objSrv.stop();
}

function onTextRegExp(bot, reParams) {
    response("onTextRegExp:", bot, reParams);
}

//---)>

function response(who, bot, params) {
    tCheckBaseBotFields(bot);

    //----------]>

    console.log("[!]", who, " => ");
    console.log("|bot: ", bot);
    console.log("|params: ", params);
    console.log("+-----------------------|");

    bot.data.text = params && params.id ? "" : bot;
    bot.data.reply_markup = bot.keyboard(bot.message.text);

    bot.send().then(console.info, console.error);
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

    expect(bot).to.have.property("data").that.is.an("object");
    expect(bot).to.have.property("send").that.is.an("function");
    expect(bot).to.have.property("forward").that.is.an("function");
}