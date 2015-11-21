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

    params.interval = (parseInt(params.interval, 10) || 2) * 1000;

    //----------------]>

    const objBot = rCreateBot(botFather, callback);

    let isStopped = false,
        tmPolling;

    //------)>

    if(params.firstLoad) {
        load();
    } else {
        runTimer();
    }

    //----------------]>

    return (function() {
        let result = Object.create(objBot);

        result.start = tmStart;
        result.stop = tmStop;

        return result;
    })();

    //----------------]>

    function load() {
        botFather.callJson("getUpdates", params, function(error, data) {
            if(objBot.cbLogger) {
                objBot.cbLogger(error, data);
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
            params.offset = data.update_id + 1;

            //--------]>

            rOnMsg(objBot, data);
        }
    }

    //----------]>

    function runTimer() {
        if(isStopped) {
            return;
        }

        tmPolling = setTimeout(load, params.interval);
    }

    function tmStart() {
        if(isStopped) {
            isStopped = false;
            runTimer();
        }

        return objBot;
    }

    function tmStop() {
        isStopped = true;
        clearTimeout(tmPolling);

        return objBot;
    }
}
