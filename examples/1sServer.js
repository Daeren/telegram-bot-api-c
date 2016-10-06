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
        //console.log(error, data);

        if(error) {
            expect(error).to.be.an.instanceof(Error);
            expect(data).to.be.null;
        }
        else {
            expect(error).to.be.null;
            expect(data).to.be.a("object");

            expect(data).to.have.property("ok");

            if(data.ok) {
                expect(data).to.have.property("result");
            }
        }
    });

//-----[TEST]-----}>

expect(objSrv).to.be.a("object");
expect(objSrv).to.have.property("start").that.is.a("function");
expect(objSrv).to.have.property("stop").that.is.a("function");

//-----[PLUGIN]-----}>

objSrv
    .use(function(bot, data, next) {
        expect(next).to.be.a("function");

        //----------]>

        tCheckBaseBotFields(bot);

        //----------]>

        console.log("Async");

        if(data === "room") {
            next("room.menu");
        }
        else {
            next();
        }
    })
    .use(function(bot) {
        tCheckBaseBotFields(bot);

        //----------]>

        console.log("Sync");

        //return "room.menu";
    });

//-----[Filter by `type`]-----}>

objSrv
    .use("text", function(bot, data, next) {
        tCheckBaseBotFields(bot);

        //----------]>

        console.log("F:Async | Type: text");

        next();
    });

objSrv
    .use(function(bot) {
        tCheckBaseBotFields(bot);

        //----------]>

        console.log("Before[use:type] Sync");
    });

objSrv
    .use("text", function() {
        console.log("F:Sync | Type: text");
    })
    .use("photo", function() {
        console.log("F:Sync | Type: photo");
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

objSrv.on("text:room.menu", onTextRoom);

objSrv
    .on(/^hello/i, ["type", "id"], onTextRegExp)
    .on(/^(id)\s+(\d+)/i, "type id", onTextRegExp)
    .on(/^(login)\s+(\w+)/i, ["type", "login"], onTextRegExp);


//------]>

function onNotFound(bot) {
    const cmd = bot.command;

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

function onTextRoom(bot, params) {
    response("onTextRoom:", bot, params);
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
    console.log("|isGroup: %s", bot.isGroup);
    console.log("|params: ", params);
    console.log("+-----------------------|");

    bot
        .answer()
        .text(params && params.id ? "" : bot)
        .keyboard(bot.message.text)
        .send().then(console.info, console.error);
}

//-------------]>

function tCheckBaseBotFields(bot) {
    expect(bot).to.be.an.instanceof(objSrv.constructor);
    expect(bot).to.be.a("object");
    expect(bot).to.have.property("message").that.is.an("object");

    //----------]>

    const msg = bot.message;

    expect(msg).to.have.property("message_id");
    expect(msg).to.have.property("from").that.is.an("object");
    expect(msg).to.have.property("chat").that.is.an("object");
    expect(msg).to.have.property("date");

    expect(bot).to.have.property("isGroup").that.is.a("boolean");
    expect(bot).to.have.property("isReply").that.is.a("boolean");

    expect(bot).to.have.property("cid").that.equal(msg.chat.id);
    expect(bot).to.have.property("mid").that.equal(msg.message_id);

    //----------]>

    expect(bot).to.have.property("answer").that.is.a("function");
    expect(bot).to.have.property("render").that.is.a("function");
}