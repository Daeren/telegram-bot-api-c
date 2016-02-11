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
      rMethods          = require("./methods");

const rUtil             = require("./../util");

//-----------------------------------------------------

const gTgHostWebhook  = "api.telegram.org";
const gCRLF           = "\r\n";

const gPipeOptions    = {"end": false};
const gReIsFilePath   = /[\\\/\.]/;

const gBoundaryUInterval = 1000 * 60 * 5;

let gBoundaryKey, gBoundaryDiv, gBoundaryEnd, gBoundaryUDate;

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
    gBoundaryUDate  = Date.now();

    gBoundaryKey    = Math.random().toString(16) + Math.random().toString(32).toUpperCase() + gBoundaryUDate.toString();
    gBoundaryDiv    = "--" + gBoundaryKey + gCRLF;
    gBoundaryEnd    = "--" + gBoundaryKey + "--" + gCRLF;
}

function genBodyField(type, field, value) {
    switch(type) {
        case "end":
            return gCRLF + gBoundaryEnd;

        case "json":
            if(typeof(value) !== "string") {
                value = JSON.stringify(value);
            }

            value = "Content-Disposition: form-data; name=\"" + field + "\"\r\nContent-Type: application/json\r\n\r\n" + value;

            break;

        case "text":
            value = "Content-Disposition: form-data; name=\"" + field + "\"\r\n\r\n" + value;
            break;

        case "photo":
            value = "Content-Disposition: form-data; name=\"photo\"; filename=\"" + field + "\"\r\nContent-Type: application/octet-stream\r\n\r\n";
            break;

        case "audio":
            value = "Content-Disposition: form-data; name=\"audio\"; filename=\"" + field + "\"\r\nContent-Type: application/octet-stream\r\n\r\n";
            break;

        case "document":
            value = "Content-Disposition: form-data; name=\"document\"; filename=\"" + field + "\"\r\nContent-Type: application/octet-stream\r\n\r\n";
            break;

        case "sticker":
            value = "Content-Disposition: form-data; name=\"sticker\"; filename=\"" + field + "\"\r\nContent-Type: application/octet-stream\r\n\r\n";
            break;

        case "video":
            value = "Content-Disposition: form-data; name=\"video\"; filename=\"" + field + "\"\r\nContent-Type: application/octet-stream\r\n\r\n";
            break;

        case "voice":
            value = "Content-Disposition: form-data; name=\"voice\"; filename=\"" + field + "\"\r\nContent-Type: application/octet-stream\r\n\r\n";
            break;

        case "certificate":
            value = "Content-Disposition: form-data; name=\"certificate\"; filename=\"" + field + "\"\r\nContent-Type: application/octet-stream\r\n\r\n";
            break;

        default:
            throw new Error("Type not found!");
    }

    return value ? (gCRLF + gBoundaryDiv + value) : "";
}

//---------]>

function getReadStreamByUrl(token, url, type, method, data, callback) {
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

    function onResponse(error, response) {
        if(error) {
            onEnd(error);
            return;
        }

        //--------------]>

        const statusCode = response.statusCode;

        if(statusCode < 200 || statusCode > 399) {
            response.destroy();
            onEnd();

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

            createStream();

            return;
        }

        //-----[Filters]-----}>

        if(data.maxSize) {
            if(!contentLength) {
                error = new Error("Unknown size");
            }
            else {
                if(contentLength > data.maxSize) {
                    error = new Error("maxSize");
                }
            }

            if(error) {
                response.destroy();
                response = undefined;
            }
        }

        //------------]>

        onEnd(error, response);
    }

    function onEnd(error, response) {
        if(error) {
            if(callback) {
                callback(error);
            }

            return;
        }

        //-------]>

        const result = Object.create(data);
        result[type] = response;

        //-------]>

        callAPI(token, method, result, callback);
    }
}

//------------------]>

function callAPI(token, method, data, callback) {
    if(!token || typeof(token) !== "string") {
        throw new Error("Forbidden. Check the Access Token: " + token + " [" + method + "]");
    }

    //-------------------------]>

    let t, result;

    let req,
        body, bodyBegin, bodyEnd,
        file, fileName, fileId;

    //---------]>

    if(typeof(data) === "function") {
        callback = data;
        data = null;
    }

    if(Date.now() - gBoundaryUDate >= gBoundaryUInterval) {
        updateBoundary();
    }

    //-------------------------]>

    switch(method) {
        case "forwardMessage":
            body = genBodyField("text", "chat_id", data.chat_id);
            body += genBodyField("text", "from_chat_id", data.from_chat_id);
            body += genBodyField("text", "message_id", data.message_id);

            break;

        case "sendMessage":
            body = genBodyField("text", "chat_id", data.chat_id);

            t = data.text;
            if(typeof(t) !== "undefined") {
                if(t && typeof(t) === "object") {
                    t = JSON.stringify(t);
                }

                body += genBodyField("text", "text", t);
            }

            t = data.parse_mode;
            if(typeof(t) !== "undefined") {
                body += genBodyField("text", "parse_mode", t);
            }

            if(data.disable_web_page_preview) {
                body += genBodyField("text", "disable_web_page_preview", "1");
            }

            t = data.reply_to_message_id;
            if(t) {
                body += genBodyField("text", "reply_to_message_id", t);
            }

            t = data.reply_markup;
            if(t) {
                body += genBodyField("json", "reply_markup", t);
            }

            break;

        case "sendPhoto":
            if(fileProcessing("photo")) {
                return;
            }

            //-------------------]>

            result = genBodyField("text", "chat_id", data.chat_id);

            t = data.caption;
            if(t) {
                result += genBodyField("text", "caption", t);
            }

            t = data.reply_to_message_id;
            if(t) {
                result += genBodyField("text", "reply_to_message_id", t);
            }

            t = data.reply_markup;
            if(t) {
                result += genBodyField("json", "reply_markup", t);
            }

            //-------------------]>

            if(fileId) {
                result += genBodyField("text", "photo", fileId);

                body = result;
            } else {
                result += genBodyField("photo", fileName);

                bodyBegin = result;
            }

            break;

        case "sendAudio":
            if(fileProcessing("audio")) {
                return;
            }

            //-------------------]>

            result = genBodyField("text", "chat_id", data.chat_id);

            t = data.duration;
            if(t) {
                result += genBodyField("text", "duration", t);
            }

            t = data.performer;
            if(t) {
                result += genBodyField("text", "performer", t);
            }

            t = data.title;
            if(t) {
                result += genBodyField("text", "title", t);
            }

            t = data.reply_to_message_id;
            if(t) {
                result += genBodyField("text", "reply_to_message_id", t);
            }

            t = data.reply_markup;
            if(t) {
                result += genBodyField("json", "reply_markup", t);
            }

            //-------------------]>

            if(fileId) {
                result += genBodyField("text", "audio", fileId);

                body = result;
            } else {
                result += genBodyField("audio", fileName);

                bodyBegin = result;
            }

            break;

        case "sendDocument":
            if(fileProcessing("document")) {
                return;
            }

            //-------------------]>

            result = genBodyField("text", "chat_id", data.chat_id);

            t = data.reply_to_message_id;
            if(t) {
                result += genBodyField("text", "reply_to_message_id", t);
            }

            t = data.reply_markup;
            if(t) {
                result += genBodyField("json", "reply_markup", t);
            }

            //-------------------]>

            if(fileId) {
                result += genBodyField("text", "document", fileId);

                body = result;
            } else {
                result += genBodyField("document", fileName);

                bodyBegin = result;
            }

            break;

        case "sendSticker":
            if(fileProcessing("sticker")) {
                return;
            }

            //-------------------]>

            result = genBodyField("text", "chat_id", data.chat_id);

            t = data.reply_to_message_id;
            if(t) {
                result += genBodyField("text", "reply_to_message_id", t);
            }

            t = data.reply_markup;
            if(t) {
                result += genBodyField("json", "reply_markup", t);
            }

            //-------------------]>

            if(fileId) {
                result += genBodyField("text", "sticker", fileId);

                body = result;
            } else {
                result += genBodyField("sticker", fileName);

                bodyBegin = result;
            }

            break;

        case "sendVideo":
            if(fileProcessing("video")) {
                return;
            }

            //-------------------]>

            result = genBodyField("text", "chat_id", data.chat_id);

            t = data.duration;
            if(t) {
                result += genBodyField("text", "duration", t);
            }

            t = data.caption;
            if(t) {
                result += genBodyField("text", "caption", t);
            }

            t = data.reply_to_message_id;
            if(t) {
                result += genBodyField("text", "reply_to_message_id", t);
            }

            t = data.reply_markup;
            if(t) {
                result += genBodyField("json", "reply_markup", t);
            }

            //-------------------]>

            if(fileId) {
                result += genBodyField("text", "video", fileId);

                body = result;
            } else {
                result += genBodyField("video", fileName);

                bodyBegin = result;
            }

            break;

        case "sendVoice":
            if(fileProcessing("voice")) {
                return;
            }

            //-------------------]>

            result = genBodyField("text", "chat_id", data.chat_id);

            t = data.duration;
            if(t) {
                result += genBodyField("text", "duration", t);
            }

            t = data.reply_to_message_id;
            if(t) {
                result += genBodyField("text", "reply_to_message_id", t);
            }

            t = data.reply_markup;
            if(t) {
                result += genBodyField("json", "reply_markup", t);
            }

            //-------------------]>

            if(fileId) {
                result += genBodyField("text", "voice", fileId);

                body = result;
            } else {
                result += genBodyField("voice", fileName);

                bodyBegin = result;
            }

            break;

        case "sendLocation":
            body = genBodyField("text", "chat_id", data.chat_id);
            body += genBodyField("text", "latitude", data.latitude);
            body += genBodyField("text", "longitude", data.longitude);

            t = data.reply_to_message_id;
            if(t) {
                body += genBodyField("text", "reply_to_message_id", t);
            }

            t = data.reply_markup;
            if(t) {
                body += genBodyField("json", "reply_markup", t);
            }

            break;

        case "sendChatAction":
            body = genBodyField("text", "chat_id", data.chat_id);
            body += genBodyField("text", "action", data.action);

            break;

        case "getUserProfilePhotos":
            body = genBodyField("text", "user_id", data.user_id);

            t = data.offset;
            if(t) {
                body += genBodyField("text", "offset", t);
            }

            t = data.limit;
            if(t) {
                body += genBodyField("text", "limit", t);
            }

            break;

        case "getUpdates":
            if(!data) {
                break;
            }

            //------]>

            result = "";

            t = data.offset;
            if(t) {
                result += genBodyField("text", "offset", t);
            }

            t = data.limit;
            if(t) {
                result += genBodyField("text", "limit", t);
            }

            t = data.timeout;
            if(t) {
                result += genBodyField("text", "timeout", t);
            }

            if(result) {
                body = result;
            }

            break;

        case "getFile":
            if(!data) {
                break;
            }

            //------]>

            t = data.file_id;
            if(t) {
                body = genBodyField("text", "file_id", t);
            }

            break;

        case "setWebhook":
            if(!data) {
                break;
            }

            //------]>

            let certLikeStrKey;

            file = data.certificate;

            //---)>

            if(file) {
                if(typeof(file) === "string") {
                    file = file.trim();

                    if(file[0] !== "." && file[0] !== "/" && file[1] !== ":") {
                        if(file[0] !== "-") {
                            file = "-----BEGIN RSA PUBLIC KEY-----\r\n" + file + "\r\n-----END RSA PUBLIC KEY-----";
                        }

                        certLikeStrKey = file;
                        file = undefined;
                    }

                    fileName = data.name || file;
                } else {
                    fileName = data.name || "file.key";
                }
            }

            //---)>

            if((t = data.url) && typeof(t) === "string") {
                result = "https://" + gTgHostWebhook + "/bot" + token + "/setWebhook?url=";

                if(!(/^https:\/\//i).test(t)) {
                    result += "https://";
                }

                t = result + t;
                result = undefined;
            }

            result = genBodyField("text", "url", t || "");

            if(fileName) {
                result += genBodyField("certificate", fileName);
            }

            if(certLikeStrKey) {
                result += certLikeStrKey;
            }

            //---)>

            if(file) {
                bodyBegin = result;
            } else {
                body = result;
            }

            break;

        case "answerInlineQuery":
            body = genBodyField("text", "inline_query_id", data.inline_query_id);

            t = data.cache_time;
            if(t) {
                body += genBodyField("text", "cache_time", t);
            }

            if(data.is_personal) {
                body += genBodyField("text", "is_personal", "1");
            }

            t = data.next_offset;
            if(t) {
                body += genBodyField("text", "next_offset", t);
            }

            body += genBodyField("json", "results", data.results);

            break;

        case "getMe":
            break;

        default:
            throw new Error("API method not found!");
    }

    //-------------------------]>

    req = rRequest(token, method, function(error, body, response) {
        if(typeof(callback) !== "function") {
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
        }

        if(error) {
            body = null;
        }

        callback(error, body, response);
    });

    if(!body && !bodyBegin) {
        req.end();
        return;
    }

    //-------------)>

    req.setHeader("Content-Type", "multipart/form-data; boundary=\"" + gBoundaryKey + "\"");

    //-------------)>

    if(body) {
        body += genBodyField("end");
        req.end(body);

        return;
    }

    //----[File: init]----}>

    bodyEnd = genBodyField("end");

    req.write(bodyBegin);

    //----[File: buffer]----}>

    if(Buffer.isBuffer(file)) {
        req.write(file);
        req.end(bodyEnd);

        return;
    }

    //----[File: stream]----}>

    if(!file) {
        req.end(bodyEnd);
        return;
    }

    if(typeof(file) === "string") {
        file = rFs.createReadStream(file);

        file.on("open", function() {
            file.pipe(req, gPipeOptions);
        });
    }
    else {
        if(file.closed) {
            req.end(bodyEnd);
            return;
        }

        file.pipe(req, gPipeOptions);
    }

    file
        .on("error", function() {
            req.end(bodyEnd);
        })
        .on("end", function() {
            req.end(bodyEnd);
        });

    //-------------------------]>

    function fileProcessing(type) {
        file = data[type];

        //--------]>

        if(!file) {
            return false;
        }

        if(typeof(file) === "string") {
            if(getReadStreamByUrl(token, file, type, method, data, callback)) { // <-- Delegate task
                return true;
            }

            fileName = data.filename || file;

            if(!gReIsFilePath.test(fileName)) {
                fileId = fileName;
            }
        }
        else if(typeof(file) === "object" && file.headers) { // <-- byUrl
            fileName = data.filename;

            if(!fileName) {
                const reqPath   = file.req.path,
                      reqCt     = file.headers["content-type"];

                const ext       = reqCt ? rPath.extname(rUtil.getFilenameByMime(reqCt)) : "";

                if(ext.length > 1) {
                    fileName = rPath.parse(reqPath).name + ext;
                }
                else {
                    fileName = reqPath;
                }
            }
        }
        else { // <-- FileStream / Buffer
            fileName = data.filename || file.path || "file";
        }

        //--------]>

        if(fileName) {
            fileName = rPath.basename(fileName);
        }

        //--------]>

        return false;
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
            if(result) {
                try {
                    result = JSON.parse(result);
                } catch(e) {
                    error = e;
                }
            }
            else {
                error = new Error("result: empty");
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