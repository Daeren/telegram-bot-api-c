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

//---------]>

objBot
    .engine(require("ejs"))
    .promise(require("bluebird"))

    .polling(onNotFound)

    .use(function(type, bot, next) {
        expect(type).to.be.a("string");
        expect(next).to.be.a("function");

        //----------]>

        tCheckBaseBotFields(bot);

        //-----[DEFAULT]-----}>

        bot.data = ["H", "i"];
        bot.render("Array | Text: {0} + {1}").then(console.log);

        bot.data = {"x": "H", "y": "i"};
        bot.render("Hashtable | Text: {x} + {y}", (e, r) => console.log(e || r));

        //-----[EJS]-----}>

        bot.data.input = {"x": "H", "y": "i"};
        bot.data.reply_markup = bot.keyboard.hGb();

        bot.render("EJS | Text: <%= x %> + <%= y %>");
    });

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