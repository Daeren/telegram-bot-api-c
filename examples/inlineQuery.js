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

gBot
    .polling()

    .on("text", function(bot, data) {
        bot
            .answer()
            .text(data)
            .inlineKeyboard("1 2 3")
            .send()
            .then(console.info, console.error);
    })

    .on("chosenInlineResult", function(bot, data) {
    })

    .on("callbackQuery", function(bot, query) {
        bot
            .answer()
            .callbackQuery(query.data === "2" ? "test" : "")
            .text("Hello")
            .send()
            .then(console.info, console.error);
    })

    .on("inlineQuery", function(bot, data) {
        const idx = Date.now().toString(32) + Math.random().toString(24);

        let results = [
            {
                "type":         "article",
                "title":        "Title #1",
                "message_text": "Text...",

                "thumb_url":    "https://pp.vk.me/c627530/v627530230/2fce2/PF9loxF4ick.jpg"
            },

            {
                "type":         "article",
                "title":        "Title #2: " + data.query,
                "message_text": "Text...yeah"
            },

            {
                "type":         "photo",

                "photo_width":  128,
                "photo_height": 128,

                "photo_url":    "https://pp.vk.me/c627530/v627530230/2fce2/PF9loxF4ick.jpg",
                "thumb_url":    "https://pp.vk.me/c627530/v627530230/2fce2/PF9loxF4ick.jpg"
            }
        ]
            .map((t, i) => { t.id = idx + i; return t; });

        /*
        results = {
            "results":          results
        };
        */

        bot
            .answer()
            .inlineQuery(results)
            .send()
            .then(console.info, console.error);
    });