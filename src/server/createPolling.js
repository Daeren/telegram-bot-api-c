//-----------------------------------------------------
//
// Author: Daeren
// Site: 666.io
//
//-----------------------------------------------------

"use strict";

//-----------------------------------------------------

const rCreateBot    = require("./createBot"),
      rOnMsg        = require("./onMsg");

const rErrors       = require("./../errors");

//-----------------------------------------------------

module.exports = main;

//-----------------------------------------------------

function main(botFather, params, callback) {
    if(typeof(params) === "function") {
        callback = params;
        params = undefined;
    }

    if(!params) {
        params = {};
    }

    //----------------]>

    const srvBot        = rCreateBot(botFather, callback);

    const tmInterval    = (parseInt(params.interval, 10) || 2) * 1000;

    let tmPolling,

        isStopped       = false,
        pollingParams   = Object.create(params);

    //------)>

    load();

    //----------------]>

    return (function() {
        const result = Object.create(srvBot);

        result.start = tmStart;
        result.stop = tmStop;

        //--------]>

        return result;

        //--------]>

        function tmStart() {
            if(isStopped) {
                isStopped = false;
                runTimer();
            }

            return result;
        }

        function tmStop() {
            isStopped = true;
            clearTimeout(tmPolling);

            return result;
        }
    })();

    //----------------]>

    function runTimer() {
        if(!isStopped) {
            tmPolling = setTimeout(load, tmInterval);
        }
    }

    function load() {
        botFather.api.getUpdates(pollingParams, function(error, data) {
            if(error) {
                if(error.code === rErrors.ERR_USED_WEBHOOK) {
                    botFather.callJson("deleteWebhook", null, load);
                }
                else {
                    rOnMsg(error, srvBot, null);
                    runTimer();
                }
            }
            else {
                if(data.length > 0) {
                    data.forEach(onMsg);
                    load();
                } else {
                    runTimer();
                }
            }
        });
    }

    function onMsg(data) {
        pollingParams.offset = data.update_id + 1;
        rOnMsg(null, srvBot, data)
    }
}