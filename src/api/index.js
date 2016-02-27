//-----------------------------------------------------
//
// Author: Daeren
// Site: 666.io
//
//-----------------------------------------------------

"use strict";

//-----------------------------------------------------

const rFs               = require("fs"),
      rPath             = require("path");

const rRequest          = require("./request"),
      rMethods          = require("./methods"),
      rProto            = require("./proto");

const rUtil             = require("./../util");

//-----------------------------------------------------

const gCRLF           = "\r\n";

const gPipeOptions    = {"end": false};
const gReIsFilePath   = /[\\\/\.]/;

const gBoundaryUInterval = 1000 * 60 * 5;

let gBoundaryKey, gBoundaryDiv, gBoundaryEnd, gBoundaryUDate, gHeaderContentType, gCRLFBoundaryDiv, gCRLFBoundaryEnd;

//-----------------------]>

updateBoundary();

//-----------------------------------------------------

module.exports = {
    "methods":          rMethods,

    "call":             callAPI,
    "callJson":         callAPIJson,

    "genMethodsForMe":  genMethodsForMe
};

//-----------------------------------------------------

function updateBoundary() {
    gBoundaryUDate      = Date.now();

    gBoundaryKey        = Math.random().toString(16) + Math.random().toString(32).toUpperCase() + gBoundaryUDate.toString();
    gBoundaryDiv        = "--" + gBoundaryKey + gCRLF;
    gBoundaryEnd        = "--" + gBoundaryKey + "--" + gCRLF;

    gCRLFBoundaryDiv    = gCRLF + gBoundaryDiv;
    gCRLFBoundaryEnd    = gCRLF + gBoundaryEnd;

    gHeaderContentType = "multipart/form-data; boundary=\"" + gBoundaryKey + "\"";
}

//---------]>

function getReadStreamByUrl(url, data, callback) {
    /*jshint -W069 */

    if(!(/^https?:\/\//).test(url)) {
        return false;
    }

    //--------------]>

    let redirectCount = 3;

    //------]>

    createStream();

    //--------------]>

    return true;

    //--------------]>

    function createStream() {
        rUtil.createReadStreamByUrl(url, onResponse);
    }

    //-----)>

    function onResponse(error, response) {
        if(!error) {
            const statusCode = response.statusCode;

            if(statusCode < 200 || statusCode > 399) {
                response.destroy();
                error = new Error("statusCode: " + statusCode);
            }
        }

        if(error) {
            callback(error);
            return;
        }

        //--------------]>

        const headers         = response.headers;

        const location        = headers["location"],
              contentLength   = headers["content-length"];

        //-----[Redirect]-----}>

        if(location && redirectCount) {
            redirectCount--;

            url = location;

            response.destroy();
            createStream();

            return;
        }

        //-----[Filters]-----}>

        if(data.maxSize) {
            if(!contentLength) {
                error = new Error("Unknown size");
            }
            else if(contentLength > data.maxSize) {
                error = new Error("maxSize");
            }
        }

        //------------]>

        if(error) {
            response.destroy();
            response = null;
        }

        callback(error, response);
    }
}

//------------------]>

function callAPI(token, method, data, callback) {
    if(!token || typeof(token) !== "string") {
        throw new Error("Forbidden. Check the Access Token: " + token + " [" + method + "]");
    }

    if(typeof(data) === "function") {
        callback = data;
        data = null;
    }

    method = method.toLowerCase();

    //-------------------------]>

    const reqMParams = rProto[method];

    const req = rRequest(token, method, function(error, body, response) {
        if(!callback) {
            return;
        }

        if(!error) {
            const statusCode = response.statusCode;

            if(statusCode >= 500) {
                error = new Error("Server Error: " + statusCode);
            }
            else if(statusCode === 401) {
                error = new Error("Invalid access token provided: " + token);
            }
            else if(!body) {
                error = new Error("body: empty");
            }
        }

        if(error) {
            body = null;
        }

        callback(error, body, response);
    });

    let isStream;

    //-------------------------]>

    if(data && reqMParams) {
        let isWritten = false;

        //-------]>

        for(let i = 0, len = reqMParams.length; i < len; i++) {
            const p     = reqMParams[i];

            const type  = p[0],
                  field = p[1];

            const value = data[field];

            //-------]>

            if(typeof(value) === "undefined" || value === null) {
                continue;
            }

            if(!isWritten) {
                isWritten = true;

                if(Date.now() - gBoundaryUDate >= gBoundaryUInterval) {
                    updateBoundary();
                }

                req.setHeader("Content-Type", gHeaderContentType);
            }

            //-------]>

            req.write(gCRLFBoundaryDiv);
            req.write("Content-Disposition: form-data; name=\"");
            req.write(field);

            if(!writeField(type, value) && !writeData(type, value)) {
                throw new Error("Type not found!");
            }
        }

        //-------]>

        if(isWritten && !isStream) {
            req.write(gCRLFBoundaryEnd);
        }
    }

    if(!isStream) {
        req.end();
    }

    //---------------]>

    function writeField(type, value) {
        switch(type) {
            case "boolean":
                value = value ? "1" : "0";

                req.write("\"\r\n\r\n");

                break;

            case "string":
                value = typeof(value) === "string" ? value : (Buffer.isBuffer(value) ? value : (value + ""));

                req.write("\"\r\n\r\n");

                break;

            case "json":
                if(typeof(value) !== "string" && !Buffer.isBuffer(value)) {
                    value = JSON.stringify(value);
                }

                req.write("\"\r\nContent-Type: application/json\r\n\r\n");

                break;

            default:
                return false;
        }

        //------]>

        req.write(value);

        //------]>

        return true;
    }

    function writeData(type, value) {
        const isBuffer = value && Buffer.isBuffer(value);

        switch(type) {
            case "message":
                req.write("\"\r\n\r\n");

                if(isBuffer || typeof(value) === "string") {
                    req.write(value);
                }
                else if(value && typeof(value) === "object") {
                    isStream = true;
                    bindStreamEvents(value).pipe(req, gPipeOptions);
                }
                else {
                    req.write(value + "");
                }

                break;

            case "photo":
            case "audio":
            case "document":
            case "sticker":
            case "video":
            case "voice":

            case "certificate":
                let filename = data.filename;

                //-------]>

                if(isBuffer) {
                }
                else if(typeof(value) === "string") {
                    if(getReadStreamByUrl(value, data, writeFileStream)) {
                        isStream = true;
                    }
                    else if(gReIsFilePath.test(value)) {
                        if(!filename) {
                            filename = value;
                        }

                        isStream = true;

                        writeFileStream(null, rFs.createReadStream(value));
                    }
                    else {
                        req.write("\"\r\n\r\n");
                        req.write(value);
                    }

                    break;
                }
                else if(value && typeof(value) === "object") {
                    isStream = true;

                    if(value.headers) {
                        if(!filename) {
                            const reqPath   = value.req.path,
                                  reqCt     = value.headers["content-type"];

                            const ext       = reqCt ? rPath.extname(rUtil.getFilenameByMime(reqCt)) : "";

                            if(ext.length > 1) {
                                filename = rPath.parse(reqPath).name + ext;
                            }
                            else {
                                filename = reqPath;
                            }
                        }
                    }
                    else {
                        filename = value.path || "file";
                    }
                }

                filename = rPath.basename(filename);

                //-------]>

                req.write("\"; filename=\"");
                req.write(filename);
                req.write("\"\r\nContent-Type: application/octet-stream\r\n\r\n");

                if(isStream) {
                    bindStreamEvents(value).pipe(req, gPipeOptions);
                }
                else if(isBuffer) {
                    req.write(value);
                }

                break;

            default:
                return false;
        }

        //---------]>

        return true;

        //---------]>

        function writeFileStream(error, input) {
            if(error || !input) {
                req.write("\"\r\n\r\n");
                req.write(gCRLFBoundaryEnd);
                req.end();
            }
            else {
                writeData(type, input);
            }
        }
    }

    function bindStreamEvents(s) {
        s
            .on("error", onEnd)
            .on("end", onEnd);

        //------]>

        return s;

        //------]>

        function onEnd() {
            req.write(gCRLFBoundaryEnd);
            req.end();
        }
    }
}

function callAPIJson(token, method, data, callback) {
    if(typeof(data) === "function") {
        callback = data;
        data = null;
    }

    //-----------]>

    callAPI(token, method, data, cbCallAPI);

    //-----------]>

    function cbCallAPI(error, result, response) {
        if(!error) {
            try {
                result = JSON.parse(result);
            } catch(e) {
                error = e;
            }
        }

        if(error) {
            result = null;
        }

        callback(error, result, response);
    }
}

//------------------]>

function genMethodsForMe(bot) {
    let result = {};

    //--------------]>

    rMethods.forEach(setMethod);

    //--------------]>

    return result;

    //--------------]>

    function setMethod(method) {
        result[method] = function(data, callback) {
            const mdPromise     = bot.mdPromise,
                  apiCallJson   = bot.callJson;

            //-------]>

            if(arguments.length === 1 && typeof(data) === "function") {
                callback = data;
                data = undefined;
            }

            if(typeof(callback) === "undefined") {
                return new mdPromise(cbPromise);
            }

            //-------------------------]>

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

                apiCallJson(method, data, function(error, data) {
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