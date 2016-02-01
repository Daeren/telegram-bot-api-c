//-----------------------------------------------------
//
// Author: Daeren
// Site: 666.io
//
//-----------------------------------------------------

"use strict";

//-----------------------------------------------------

const rRequest       = require("./request"),
      rMethods       = require("./methods");

//-----------------------------------------------------

module.exports = {
    "request":          rRequest,
    "methods":          rMethods,

    "genMethodsForMe":  genApiMethods
};

//-----------------------------------------------------

function genApiMethods(bot) {
    let result = {};

    //--------------]>

    rMethods.forEach(setMethod);

    //--------------]>

    return result;

    //--------------]>

    function setMethod(method) {
        result[method] = function(data, callback) {
            if(arguments.length === 1 && typeof(data) === "function") {
                callback = data;
                data = undefined;
            }

            if(typeof(callback) === "undefined") {
                return new bot.mdPromise(cbPromise);
            }

            cbPromise();

            //-------------------------]>

            function cbPromise(resolve, reject) {
                callback = callback || function(error, results) {
                    if(error) {
                        reject(error);
                    }
                    else {
                        resolve(results);
                    }
                };

                bot.callJson(method, data, function(error, data) {
                    error = error || genErrorByTgResponse(data) || null;

                    if(!error) {
                        data = data.result;
                    }

                    callback(error, data);
                });
            }
        };
    }

    function genErrorByTgResponse(data) {
        if(data && !data.ok) {
            const error = new Error(data.description);
            error.code = data.error_code;

            return error;
        }
    }
}