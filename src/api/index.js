//-----------------------------------------------------
//
// Author: Daeren
// Site: 666.io
//
//-----------------------------------------------------

"use strict";

//-----------------------------------------------------

const rFs               = require("fs"),
      rPath             = require("path"),
      rUrl              = require("url");

const rRequest          = require("./request"),
      rProto            = require("./proto");

const rUtil             = require("./../util"),
      rErrors           = require("./../errors");

//-----------------------------------------------------

const gCRLF                 = "\r\n";

const gPipeOptions          = {"end": false};

const gReIsFilePath         = /[\\\/\.]/,
      gReIsHttpSUri         = /^https?:\/\//;

const gMaxFileSize          = 1024 * 1024 * 50,
      gBoundaryUInterval    = 1000 * 60 * 5;

let gBoundaryKey, gBoundaryUDate, gHeaderContentType,
    gBoundaryDiv, gBoundaryEnd,
    gCRLFBoundaryDiv, gCRLFBoundaryEnd;

//-----------------------]>

updateBoundary();

//-----------------------------------------------------

module.exports = {
    "call":             callAPI,
    "callJson":         callAPIJson,

    genMethodsFor
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

    if(!(gReIsHttpSUri).test(url)) {
        return false;
    }

    //--------------]>

    let redirectCount = 3;

    createStream();

    //--------------]>

    return true;

    //--------------]>

    function createStream() {
        rUtil.createReadStreamByUrl(url, onResponse);
    }

    function onResponse(error, response) {
        const statusCode = response ? response.statusCode : 0;

        if(!error && (statusCode < 200 || statusCode > 399)) {
            error = new Error("statusCode: " + statusCode);
        }

        if(error) {
            onEnd(error, response);
            return;
        }

        //--------------]>

        const headers         = response.headers || {};

        const location        = headers["location"],
              contentLength   = headers["content-length"];

        //---------]>

        if(location && redirectCount) {
            const urlParams = rUrl.parse(url),
                  locParams = rUrl.parse(location);

            for(let name in urlParams) {
                if(hasOwnProperty.call(urlParams, name) && !locParams[name]) {
                    locParams[name] = urlParams[name];
                }
            }

            url = rUrl.format(locParams);

            redirectCount--;
            response.destroy();

            createStream();
        }
        else {
            if(contentLength) {
                const paramsMaxSize = Math.min(Math.max(parseInt(data.maxSize, 10) || gMaxFileSize, gMaxFileSize), gMaxFileSize);

                if(contentLength > paramsMaxSize) {
                    error = new Error("maxSize: " + paramsMaxSize);
                }
            }

            onEnd(error, response);
        }
    }

    function onEnd(error, response) {
        if(error) {
            if(response) {
                response.destroy();
            }

            response = null;

            error.code = rErrors.ERR_BAD_REQUEST;
        }

        callback(error, response);
    }
}

//--------[PublicMethods]--------}>

function callAPI(token, method, data, callback, proxy) {
    let isWritten, req;

    //-------------------------]>

    if(token && typeof(token) === "object") {
        callback = data;

        data = method;

        method = token.method;
        proxy = token.proxy;
        token = token.token;
    }

    if(!token) {
        throw new Error("callAPI: `token` was not specified.");
    }

    if(!method) {
        throw new Error("callAPI: `method` was not specified.");
    }

    if(callback && typeof(callback) !== "function") {
        proxy = callback;
        callback = null;
    }

    if(typeof(data) === "function") {
        callback = data;
        data = null;
    }

    //-------------------------]>

    const dataIsMap     = data instanceof Map,
          dataIsArray   = dataIsMap ? false : Array.isArray(data);

    const dataLen       = (dataIsArray ? data.length : 0);

    //-------------------------]>

    rRequest(proxy, token, method, callback, onReqInit);

    //-------------------------]>

    function onReqInit(request) {
        req = request;

        if(data) {
            rUtil.forEachAsync(rProto.params[method.toLowerCase()], iterReqMthParams, onReqMthEnd);
        }
        else {
            onReqMthEnd();
        }
    }

    function iterReqMthParams(next, param, index) {
        if(dataIsArray && index >= dataLen) {
            next(null, null, true);
            return;
        }

        //-------]>

        const type  = param[0],
              field = param[1];

        const value = dataIsMap ? data.get(field) : dataIsArray ? data[index] : data[field];

        //-------]>

        if(typeof(value) === "undefined" || value === null) {
            next();
            return;
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

        if(!writeFieldParam(type, value, next) && !writeFieldData(type, value, next)) {
            throw new Error("Type not found!");
        }
    }

    function onReqMthEnd(error) {
        if(error) {
            req.destroy(error);
        }
        else {
            if(isWritten) {
                req.write(gCRLFBoundaryEnd);
            }

            req.end();
        }
    }

    //-------------------------]>

    function writeFieldParam(type, value, next) {
        switch(type) {
            case "boolean":
                value = value ? "1" : "0";

                req.write("\"\r\n\r\n");
                break;

            case "string":
                value = typeof(value) === "string" || Buffer.isBuffer(value) ? value : (value + "");

                req.write("\"\r\n\r\n");
                break;

            case "json":
                value = typeof(value) === "string" || Buffer.isBuffer(value) ? value : (JSON.stringify(value) || "");

                req.write("\"\r\nContent-Type: application/json\r\n\r\n");
                break;

            default:
                return false;
        }

        //------]>

        req.write(value);
        process.nextTick(next);

        //------]>

        return true;
    }

    function writeFieldData(type, value, next) {
        const isBuffer = value && Buffer.isBuffer(value);

        switch(type) {
            case "message":
                req.write("\"\r\n\r\n");

                if(!isBuffer && typeof(value) === "object") {
                    value.on("error", next).on("end", next).pipe(req, gPipeOptions);
                }
                else {
                    if(!isBuffer && typeof(value) !== "string") {
                        value += "";
                    }

                    req.write(value);
                    process.nextTick(next);
                }

                break;

            case "photo":
            case "audio":
            case "document":
            case "sticker":
            case "video":
            case "voice":
            case "certificate":
                if(typeof(value) === "string") {
                    if(getReadStreamByUrl(value, data, function(error, src) {
                            if(error || !src) {
                                process.nextTick(next, error);
                            }
                            else {
                                writeFieldData(type, src, next);
                            }
                        }))
                    {
                    }
                    else if(gReIsFilePath.test(value)) {
                        writeFieldData(type, rFs.createReadStream(value), next);
                    }
                    else {
                        req.write("\"\r\n\r\n");
                        req.write(value);

                        process.nextTick(next);
                    }
                }
                else {
                    let filename = data.filename;

                    //-------]>

                    if(!filename && !isBuffer && typeof(value) === "object") {
                        if(value.headers) {
                            const reqPath = value.req.path,
                                reqCt   = value.headers["content-type"];

                            const ext     = reqCt ? rPath.extname(rUtil.getFilenameByMime(reqCt)) : "";

                            filename = ext.length > 1 ? (rPath.parse(reqPath).name + ext) : reqPath;
                        }
                        else {
                            filename = value.path || "file";
                        }
                    }

                    //-------]>

                    req.write("\"; filename=\"");
                    req.write(rPath.basename(filename));
                    req.write("\"\r\nContent-Type: application/octet-stream\r\n\r\n");

                    if(isBuffer) {
                        req.write(value);
                        process.nextTick(next);
                    }
                    else {
                        value.on("error", next).on("end", next).pipe(req, gPipeOptions);
                    }
                }

                break;

            default:
                return false;
        }

        //---------]>

        return true;
    }
}

function callAPIJson(token, method, data, callback, proxy) {
    if(token && typeof(token) === "object") {
        callback = data;

        data = method;

        method = token.method;
        proxy = token.proxy;
        token = token.token;
    }

    if(callback && typeof(callback) !== "function") {
        proxy = callback;
        callback = null;
    }

    if(typeof(data) === "function") {
        callback = data;
        data = null;
    }

    //-----------]>

    callAPI(token, method, data, callback ? cbCallAPI : null, proxy);

    //-----------]>

    function cbCallAPI(error, result, response) {
        if(!error) {
            const isJson = response.headers["content-type"] === "application/json";

            if(isJson) {
                try {
                    result = JSON.parse(result);
                } catch(e) {
                    error = e;
                }
            }

            if(!isJson || error) {
                error = error || new Error("Expected JSON (" + response.statusCode + ").");

                error.code = rErrors.ERR_FAILED_PARSE_DATA;
                error.data = result;
            }
        }

        if(error) {
            result = null;
        }

        callback(error, result, response);
    }
}

//--------[PrivateMethods]--------}>

function genMethodsFor(bot) {
    const result = {};

    //--------------]>

    rProto.methods.forEach(setMethod);

    //--------------]>

    return result;

    //--------------]>

    function setMethod(method) {
        result[method] = mthAPI;

        function mthAPI(data, callback) {
            if(typeof(data) === "function") {
                callback = data;
                data = null;
            }

            //-------------------------]>

            if(!callback) {
                return new bot.mdPromise(cbPromise);
            }

            cbPromise();

            //-------------------------]>

            function cbPromise(resolve, reject) {
                bot.callJson(method, data, function(error, data) {
                    error       = error || genErrorByTgResponse(data);
                    data        = error ? null : data.result;
                    callback    = callback || ((e, r) => error ? reject(e) : resolve(r));

                    callback(error, data);
                });
            }
        }
    }

    function genErrorByTgResponse(data) {
        if(data && !data.ok) {
            const error = new Error(data.description);

            error.code = data.error_code;

            if(data.parameters) {
                error.retryAfter = data.retry_after;
            }

            return error;
        }

        return null;
    }
}