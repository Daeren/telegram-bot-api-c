//-----------------------------------------------------
//
// Author: Daeren
// Site: 666.io
//
//-----------------------------------------------------

"use strict";

//-----------------------------------------------------

const rUtil     = require("./../../util"),
      rParseCmd = require("./../../parseCmd");

//-----------------------------------------------------

module.exports = main;

//-----------------------------------------------------

function main(ingDataType, queue, events, input, reqCtx, evName, dataField, callback) {
    const data = dataField ? input[dataField] : null;

    let cmdParams = reqCtx.command;

    //------------]>

    if(cmdParams !== null && evName === "text") {
        cmdParams = reqCtx.command = rParseCmd(data);
    }

    rUtil.forEachAsync(queue, iterQueue, onEndQueue);

    //------------]>

    function iterQueue(next, plugin) {
        const plType            = plugin[0],
              plParams          = plugin[1],
              plIsFilter        = plugin[2],
              plCallback        = plugin[3];

        const isPlGenerator     = plCallback.constructor.name === "GeneratorFunction",
              isPlWithFilter    = !!plType,
              isPlSync          = isPlGenerator ? false : plCallback.length < 3;

        let plData              = data,
            isEnd               = false;

        let cbPlResult;

        //----------]>

        if(isPlWithFilter) {
            if(ingDataType === plType) {
                plData = input;
            }
            else if(cmdParams && ("/" === plType || cmdParams.cmd === plType)) {
                plData = cmdParams;
            }
            else if("*" !== plType && evName !== plType) {
                onNext();
                return;
            }
            else if(plIsFilter && (plIsFilter instanceof RegExp)) {
                plData = plData.match(plIsFilter);

                if(!plData) {
                    onNext();
                    return;
                }

                if(plParams) {
                    const result  = {};

                    for(let i = 0, len = Math.min(plData.length - 1, plParams.length); i < len; i++) {
                        result[plParams[i]] = plData[i + 1];
                    }

                    plData = result;
                }
            }
        }

        //---------]>

        try {
            cbPlResult = isPlGenerator || isPlSync ? plCallback(reqCtx, plData) : plCallback(reqCtx, plData, onNext);
        } catch(error) {
            onNext(error);
            return;
        }

        //---------]>

        if(isPlGenerator) {
            rUtil.executeGenerator(cbPlResult, (error, result) => onNext(error || result));
        }

        if(isPlSync) {
            onNext(cbPlResult);
        }

        //---------]>

        function onNext(state) {
            if(isEnd) {
                throw new Error("Plugin: double call `next`");
            }

            isEnd = true;

            setImmediate(next, state);
        }
    }

    function onEndQueue(state) {
        if(state && state instanceof Error) {
            callback(state, reqCtx);
        }
        else {
            const evType = cmdParams ? cmdParams.cmd : (evName || ingDataType);

            queue = events && (events[state ? (evType + ":" + state) : evType] || events[evType] || cmdParams && events["/"] || !cmdParams && events["*"]);

            if(queue) {
                main(ingDataType, queue, null, input, reqCtx, evName, dataField, callback);
            }
            else {
                callback(null, events ? reqCtx : null, state);
            }
        }
    }
}