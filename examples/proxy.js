//-----------------------------------------------------
//
// Author: Daeren
// Site: 666.io
//
//-----------------------------------------------------

/*jshint expr: true*/

"use strict";

//-----------------------------------------------------

const rBot      = require("./../index");

//-----------------------------------------------------

const gBot = rBot(process.env.TELEGRAM_BOT_TOKEN);

const gProxyStr = "87.255.70.228:3128",
      gProxyObj = {
          "host": gProxyStr.split(":")[0],
          "port": gProxyStr.split(":")[1]
      };

//-----------------------------------------------------

gBot.proxy(gProxyObj);

getMe(t => {
    gBot.proxy(gProxyStr);

    getMe(t => {
        gBot.proxy();

        getMe(t => {
            rBot.callJson({
                "token":    process.env.TELEGRAM_BOT_TOKEN,
                "method":   "getMe",
                "proxy":    gProxyStr
            }, null, (e, data, res) => {
                console.log(e || data);

                rBot.callJson(process.env.TELEGRAM_BOT_TOKEN, "getMe", null, (e, data, res) => console.log(e || data), gProxyObj);
            });
        });
    });
});

//-----------------------------------------------------

function getMe(callback) {
    gBot.api.getMe(function(error, data) {
        console.log(error, data);

        if(error) {
            console.log(error.data && error.data.toString());
        }

        if(callback) {
            callback();
        }
    });
}