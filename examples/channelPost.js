//-----------------------------------------------------
//
// Author: Daeren
// Site: 666.io
//
//-----------------------------------------------------

/*jshint expr: true*/

"use strict";

//-----------------------------------------------------

const rTgBot    = require("./../index");

const gBot      = rTgBot(process.env.TELEGRAM_BOT_TOKEN);

//----------------]>

gBot.enable("tgUrlUpload");

//----------------]>

gBot
    .polling()

    .use("channelPost", function(bot, data, next) {
        bot.answer().text("use:channelPost").send(() => next());
    })
    .use("editedChannelPost", function(bot, data, next) {
        bot.answer().text("use:editedChannelPost").send(() => next());
    })
    .use("photo", function(bot, data, next) {
        bot.answer().text("use:photo").send(() => next());
    })


    .on("text", function(bot, url) {
        bot.answer().photo(url).send();
    })


    .on("message editedMessage channelPost editedChannelPost photo", function(bot) {
        bot
            .answer()
            .text(bot.updateType + " | " + bot.updateSubType + " | " + bot.eventType + " | " + bot.eventSubType)
            .send();
    })


    //.on("message", function(bot) {
    //    bot.answer().text("message").send();
    //})
    //.on("editedMessage", function(bot) {
    //    bot.answer().text("editedMessage").send();
    //})
    //.on("channelPost", function(bot) {
    //    bot.answer().text("channelPost").send();
    //})
    //.on("editedChannelPost", function(bot) {
    //    bot.answer().text("editedChannelPost").send();
    //})
    .on("photo", function(bot) {
        bot.answer().text("photo").send();
    });