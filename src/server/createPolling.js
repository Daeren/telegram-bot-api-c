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

    if(params.firstLoad) {
        load();
    } else {
        runTimer();
    }

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

    function load() {
        botFather.callJson("getUpdates", pollingParams, function(error, data) {
            if(srvBot.cbLogger) {
                srvBot.cbLogger(error, data);
            }

            if(error) {
                runTimer();
            }
            else {
                onLoadSuccess(data);
            }
        });
    }

    function runTimer() {
        if(!isStopped) {
            tmPolling = setTimeout(load, tmInterval);
        }
    }

    //-------)>

    function onLoadSuccess(data) {
        if(!data.ok) {
            if(data.error_code === rErrors.ERR_USED_WEBHOOK) {
                botFather.callJson("setWebhook", null, load);
            }
            else {
                runTimer();
            }
        }
        else {
            const result = data.result;

            if(result.length > 0) {
                result.forEach(onMsg);
                load();
            } else {
                runTimer();
            }
        }

        //------------]>

        function onMsg(data) {
            pollingParams.offset = data.update_id + 1;

            //--------]>

            rOnMsg(srvBot, data);
        }
    }
}
