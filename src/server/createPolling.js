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

    const srvBot = rCreateBot(botFather, callback);

    const pollingTmInterval = (parseInt(params.interval, 10) || 2) * 1000;

    let tmPolling,

        isStopped = false,
        pollingParams = Object.create(params);

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

        return result;
    })();

    //----------------]>

    function load() {
        botFather.callJson("getUpdates", pollingParams, function(error, data) {
            if(srvBot.cbLogger) {
                srvBot.cbLogger(error, data);
            }

            if(error) {
                runTimer();
                return;
            }

            //--------]>

            onLoadSuccess(data);
        });
    }

    //-------)>

    function onLoadSuccess(data) {
        if(!data.ok) {
            if(data.error_code === 409) {
                botFather.callJson("setWebhook", null, load);
            }
            else {
                runTimer();
            }

            return;
        }

        if(data.result.length) {
            data.result.forEach(onMsg);
            load();
        } else {
            runTimer();
        }

        //------------]>

        function onMsg(data) {
            pollingParams.offset = data.update_id + 1;

            //--------]>

            rOnMsg(srvBot, data);
        }
    }

    //----------]>

    function runTimer() {
        if(!isStopped) {
            tmPolling = setTimeout(load, pollingTmInterval);
        }
    }

    //----)>

    function tmStart() {
        if(isStopped) {
            isStopped = false;
            runTimer();
        }

        return this;
    }

    function tmStop() {
        isStopped = true;
        clearTimeout(tmPolling);

        return this;
    }
}
