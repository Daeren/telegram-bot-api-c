//-----------------------------------------------------
//
// Author: Daeren
// Site: 666.io
//
//-----------------------------------------------------

/*jshint expr: true*/

"use strict";

//-----------------------------------------------------

const rTgBot    = require("telegram-bot-api-c"),
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
            .data()
            .text(gStringTable.texts.start)
            .render(input)
            .keyboard(gStringTable.buttons.currency, "resize")
            .send();
    })

    .on("text", function(bot, currency) {
        const url =
            "https://query.yahooapis.com/v1/public/yql?q=select+*+from+yahoo.finance.xchange+where+pair+=+'"
            + currency +
            "'&format=json&env=store%3A%2F%2Fdatatables.org%2Falltableswithkeys";

        //----------]>

        rUnirest.get(url).as.json(onEnd);

        //----------]>

        function onEnd(response) {
            const rb    = bot.data(),
                  query = response.body.query;

            let rate = query.results ? query.results.rate : undefined;
            let text = "";

            //------]>

            if(query.count === 1) {
                rate = [rate];
            }

            if(rate) {
                rate = rate.filter(r => r.Name !== "N/A");
            }

            if(!rate || !rate.length) {
                rb.text(gStringTable.texts.notFound).send();
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

            rb.text(text).send();
        }
    });