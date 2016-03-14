//-----------------------------------------------------
//
// Author: Daeren
// Site: 666.io
//
//-----------------------------------------------------

/*jshint expr: true*/

"use strict";

//-----------------------------------------------------

const rTgBot    = require("./../index"),
      rUnirest  = require("unirest");

const gBot      = rTgBot(process.env.TELEGRAM_BOT_TOKEN);

//----------------]>

const gStringTable = {
    "texts": {
        "start": "Hi, {userName}!",
        "notFound": "Not found :/"
    },

    "buttons": {
        "currency": "USDRUB EURRUB USDRUB,EURRUB"
    }
};

//----------------]>

gBot
    .polling()

    .on("/start", function(bot) {
        const input = {
            "userName": bot.message.from.first_name
        };

        bot
            .answer()
            .text(gStringTable.texts.start)
            .render(input)
            .keyboard(gStringTable.buttons.currency, "resize")
            .send();
    })

    .on("text", function(bot, currency) {
        const url =
            "https://query.yahooapis.com/v1/public/yql?q=select+*+from+yahoo.finance.xchange+where+pair+=+'" +
            currency +
            "'&format=json&env=store%3A%2F%2Fdatatables.org%2Falltableswithkeys";

        //----------]>

        rUnirest.get(url).as.json(onEnd);

        //----------]>

        function onEnd(response) {
            const answer    = bot.answer(),
                  query     = response.body.query;

            let rate = query.results ? query.results.rate : undefined;
            let text = "";

            //------]>

            rate = query.count === 1 ? [rate] : rate;
            rate = rate ? rate.filter(r => r.Name !== "N/A") : rate;

            if(!rate || !rate.length) {
                answer.text(gStringTable.texts.notFound).send();
                return;
            }

            //------]>

            rate.forEach(function(r) {
                if(text) {
                    text += "\n";
                }

                text += `${r.Name}: ${r.Rate} => Ask: ${r.Ask} |  Bid: ${r.Bid}`;
            });

            //------]>

            answer.text(text).send();
        }
    });