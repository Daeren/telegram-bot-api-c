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
    .polling(function* (bot) {
        const result = yield send(bot);
        console.info(result);

        //------]>

        //x / 0;

        yield error();
    })
    .use(function* (type, bot) {
        yield auth("D", "13");
    })
    .use("text", function* (bot) {
        yield save();

        if(bot.message.text === "key") {
            return "eventYield";
        }
    })

    .on("text:eventYield", function(bot, data) {
        console.log("eventYield:", data);
    })
    .on("error", function(error) { // <-- Only for JS Generators
        console.error(error);
    });

//----------------]>

function auth(bot) {
    console.log("auth", arguments);

    return new Promise(x => setTimeout(x, 1000));
}

function save(bot) {
    console.log("save", arguments);

    return new Promise(x => setTimeout(x, 1000));
}

function send(bot) {
    console.log("send", arguments);

    return bot.sendMessage("Ok, let's go...");
}

function error() {
    console.log("error", arguments);

    return new Promise((x, z) => setTimeout(z, 1000, new Error("MyError")));
}