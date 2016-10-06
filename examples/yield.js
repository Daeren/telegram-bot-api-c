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
    .catch(function* (error) {
        //x / 0;
        console.error(error);
        yield Promise.resolve();
    })

    .use(function* () {
        yield auth("D", "13");
    })
    .use("text", function* (bot, text) {
        yield save();

        if(text === "key") {
            return "eventYield";
        }
    })

    .on("text:eventYield", function* (bot, data) {
        console.log("eventYield:", data);
        yield Promise.resolve();
    });

//----------------]>

function auth() {
    console.log("auth", arguments);

    return new Promise(x => setTimeout(x, 1000));
}

function save() {
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