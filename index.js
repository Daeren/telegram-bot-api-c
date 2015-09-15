//-----------------------------------------------------
//
// Author: Daeren Torn
// Site: 666.io
//
//-----------------------------------------------------

"use strict";

//-----------------------------------------------------

var rHttp           = require("http"),
    rHttps          = require("https"),
    rUrl            = require("url"),
    rFs             = require("fs"),
    rStream         = require("stream");

//-----------------------------------------------------

var gCRLF           = "\r\n";

var gPipeOptions    = {"end": false};
var gReqOptions     = {
    "host":         "api.telegram.org",
    "method":       "POST"
};

var gReFindCmd      = /(^\/\S*?)@\S+\s*(.*)/,
    gReReplaceCmd   = /^@\S+\s/,
    gReSplitCmd     = /\s+([\s\S]+)?/,

    gRePhotoExt     = /\.(jp[e]?g|[gt]if|png|bmp)$/i,
    gReAudioExt     = /\.(mp3)$/i,
    gReDocumentExt  = /[\\\/\.]/,
    gReStickerExt   = /\.(jp[e]?g|[gt]if|png|bmp|webp)$/i,
    gReVideoExt     = /\.(mp4)$/i,
    gReVoiceExt     = /\.(ogg)$/i;

var gApiMethods     = [
    "getMe", "forwardMessage",
    "sendMessage", "sendPhoto", "sendAudio", "sendDocument", "sendSticker", "sendVideo", "sendVoice", "sendLocation", "sendChatAction",
    "getUserProfilePhotos", "getUpdates",
    "setWebhook"
];

var gMethodsMap     = {
    "message":      "sendMessage",
    "photo":        "sendPhoto",
    "audio":        "sendAudio",
    "document":     "sendDocument",
    "sticker":      "sendSticker",
    "video":        "sendVideo",
    "voice":        "sendVoice",
    "location":     "sendLocation",
    "chatAction":   "sendChatAction"
};

var gMMTypesKeys    = Object.keys(gMethodsMap),
    gMMTypesLen     = gMMTypesKeys.length;

//-----------------------------------------------------

module.exports = main;

//-----------------------------------------------------

function main(token) {
    var gBoundaryKey, gBoundaryDiv, gBoundaryEnd,

        gBoundaryUDate,
        gBoundaryUIntr  = 1000 * 60 * 5;

    //---------)>

    updateBoundary();

    //---------)>

    var CMain = function() {
        this.api = genApi();
    };

    CMain.prototype = {
        "setToken":     function(t) { token = t; return this; },

        "call":         callAPI,
        "callJson":     callAPIJson,

        "send":         send,

        "server":       server,
        "polling":      polling,

        "parseCmd":     parseCmd
    };

    //-------------------------]>

    return new CMain();

    //-------------------------]>

    function request(api, callback) {
        if(!api)
            throw new Error("`api` was not specified in `request`");

        gReqOptions.path = "/bot" + token + "/" + api;

        //--------------]>

        api = rHttps.request(gReqOptions, cbRequest);

        if(typeof(callback) === "function") {
            api.on("error", callback);
        }

        //--------------]>

        return api;

        //--------------]>

        function cbRequest(response) {
            var error,
                firstChunk, chunks;

            if(response.statusCode === 403)
                error = new Error("Check the Access Token: " + token);

            if(typeof(callback) !== "function") {
                if(error)
                    throw error;

                return;
            }

            //---------]>

            response.on("data", function(chunk) {
                if(!firstChunk)
                    firstChunk = chunk;
                else {
                    chunks = chunks || [firstChunk];
                    chunks.push(chunk);
                }
            });

            response.on("end", function() {
                callback(error || null, chunks ? Buffer.concat(chunks) : firstChunk, response);
            });
        }
    }

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
        }

        switch(type) {
            case "text":
                value = "Content-Disposition: form-data; name=\"" + field + "\"\r\n\r\n" + value;
                break;

            case "json":
                value = "Content-Disposition: form-data; name=\"" + field + "\"\r\nContent-Type: application/json\r\n\r\n" + value;
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
        }

        return value ? (gCRLF + gBoundaryDiv + value) : "";
    }

    //-----------[L1]----------}>

    function callAPI(method, data, callback) {
        var req,
            body, bodyBegin, bodyEnd,
            file, fileName, fileId;

        if(arguments.length == 2) {
            if(typeof(data) === "function") {
                callback = data;
                data = null;
            }
        }

        if(Date.now() - gBoundaryUDate >= gBoundaryUIntr)
            updateBoundary();

        //-------------------------]>

        switch(method) {
            case "forwardMessage":
                body = genBodyField("text", "chat_id", data.chat_id);
                body += genBodyField("text", "from_chat_id", data.from_chat_id);
                body += genBodyField("text", "message_id", data.message_id);

                break;

            case "sendMessage":
                var t;

                body = genBodyField("text", "chat_id", data.chat_id);

                if((t = data.text) && typeof(t) !== "undefined")
                    body += genBodyField("text", "text", t);

                if((t = data.parse_mode) && typeof(t) !== "undefined")
                    body += genBodyField("text", "parse_mode", t);

                if(t = data.disable_web_page_preview)
                    body += genBodyField("text", "disable_web_page_preview", "1");

                if(t = data.reply_to_message_id)
                    body += genBodyField("text", "reply_to_message_id", t);

                if(t = data.reply_markup) {
                    if(t && typeof(t) !== "string")
                        t = JSON.stringify(t);

                    body += genBodyField("json", "reply_markup", t);
                }

                break;

            case "sendPhoto":
                var t, result;

                file = data.photo;

                if(typeof(file) === "string") {
                    if(getReadStreamByUrl(file, "photo", method, data, callback))
                        return;

                    fileName = data.name || file;

                    if(!gRePhotoExt.test(fileName))
                        fileId = fileName;
                } else {
                    fileName = data.name || "photo.png";
                }

                //-------------------]>

                result = genBodyField("text", "chat_id", data.chat_id);

                if(t = data.caption)
                    result += genBodyField("text", "caption", t);

                if(t = data.reply_to_message_id)
                    result += genBodyField("text", "reply_to_message_id", t);

                if(t = data.reply_markup) {
                    if(t && typeof(t) !== "string")
                        t = JSON.stringify(t);

                    result += genBodyField("json", "reply_markup", t);
                }

                //-------------------]>

                if(fileId) {
                    result += genBodyField("text", "photo", fileId);

                    body = result;
                } else {
                    result += genBodyField("photo", fileName);

                    bodyBegin = result;
                    bodyEnd = "";
                }

                break;

            case "sendAudio":
                var t, result;

                file = data.audio;

                if(typeof(file) === "string") {
                    if(getReadStreamByUrl(file, "audio", method, data, callback))
                        return;

                    fileName = data.name || file;

                    if(!gReAudioExt.test(fileName))
                        fileId = fileName;
                } else {
                    fileName = data.name || "audio.mp3";
                }

                //-------------------]>

                result = genBodyField("text", "chat_id", data.chat_id);

                if(t = data.duration)
                    result += genBodyField("text", "duration", t);

                if(t = data.performer)
                    result += genBodyField("text", "performer", t);

                if(t = data.title)
                    result += genBodyField("text", "title", t);

                if(t = data.reply_to_message_id)
                    result += genBodyField("text", "reply_to_message_id", t);

                if(t = data.reply_markup) {
                    if(t && typeof(t) !== "string")
                        t = JSON.stringify(t);

                    result += genBodyField("json", "reply_markup", t);
                }

                //-------------------]>

                if(fileId) {
                    result += genBodyField("text", "audio", fileId);

                    body = result;
                } else {
                    result += genBodyField("audio", fileName);

                    bodyBegin = result;
                    bodyEnd = "";
                }

                break;

            case "sendDocument":
                var t, result;

                file = data.document;

                if(typeof(file) === "string") {
                    if(getReadStreamByUrl(file, "document", method, data, callback))
                        return;

                    fileName = data.name || file;

                    if(!gReDocumentExt.test(fileName))
                        fileId = fileName;
                } else {
                    fileName = data.name || "document";
                }

                //-------------------]>

                result = genBodyField("text", "chat_id", data.chat_id);

                if(t = data.reply_to_message_id)
                    result += genBodyField("text", "reply_to_message_id", t);

                if(t = data.reply_markup) {
                    if(t && typeof(t) !== "string")
                        t = JSON.stringify(t);

                    result += genBodyField("json", "reply_markup", t);
                }

                //-------------------]>

                if(fileId) {
                    result += genBodyField("text", "document", fileId);

                    body = result;
                } else {
                    result += genBodyField("document", fileName);

                    bodyBegin = result;
                    bodyEnd = "";
                }

                break;

            case "sendSticker":
                var t, result;

                file = data.sticker;

                if(typeof(file) === "string") {
                    if(getReadStreamByUrl(file, "document", method, data, callback))
                        return;

                    fileName = data.name || file;

                    if(!gReStickerExt.test(fileName))
                        fileId = fileName;
                } else {
                    fileName = data.name || "sticker.webp";
                }

                //-------------------]>

                result = genBodyField("text", "chat_id", data.chat_id);

                if(t = data.reply_to_message_id)
                    result += genBodyField("text", "reply_to_message_id", t);

                if(t = data.reply_markup) {
                    if(t && typeof(t) !== "string")
                        t = JSON.stringify(t);

                    result += genBodyField("json", "reply_markup", t);
                }

                //-------------------]>

                if(fileId) {
                    result += genBodyField("text", "sticker", fileId);

                    body = result;
                } else {
                    result += genBodyField("sticker", fileName);

                    bodyBegin = result;
                    bodyEnd = "";
                }

                break;

            case "sendVideo":
                var t, result;

                file = data.video;

                if(typeof(file) === "string") {
                    if(getReadStreamByUrl(file, "video", method, data, callback))
                        return;

                    fileName = data.name || file;

                    if(!gReVideoExt.test(fileName))
                        fileId = fileName;
                } else {
                    fileName = data.name || "video.mp4";
                }

                //-------------------]>

                result = genBodyField("text", "chat_id", data.chat_id);

                if(t = data.duration)
                    result += genBodyField("text", "duration", t);

                if(t = data.caption)
                    result += genBodyField("text", "caption", t);

                if(t = data.reply_to_message_id)
                    result += genBodyField("text", "reply_to_message_id", t);

                if(t = data.reply_markup) {
                    if(t && typeof(t) !== "string")
                        t = JSON.stringify(t);

                    result += genBodyField("json", "reply_markup", t);
                }

                //-------------------]>

                if(fileId) {
                    result += genBodyField("text", "video", fileId);

                    body = result;
                } else {
                    result += genBodyField("video", fileName);

                    bodyBegin = result;
                    bodyEnd = "";
                }

                break;

            case "sendVoice":
                var t, result;

                file = data.voice;

                if(typeof(file) === "string") {
                    if(getReadStreamByUrl(file, "voice", method, data, callback))
                        return;

                    fileName = data.name || file;

                    if(!gReVoiceExt.test(fileName))
                        fileId = fileName;
                } else {
                    fileName = data.name || "voice.ogg";
                }

                //-------------------]>

                result = genBodyField("text", "chat_id", data.chat_id);

                if(t = data.duration)
                    result += genBodyField("text", "duration", t);

                if(t = data.reply_to_message_id)
                    result += genBodyField("text", "reply_to_message_id", t);

                if(t = data.reply_markup) {
                    if(t && typeof(t) !== "string")
                        t = JSON.stringify(t);

                    result += genBodyField("json", "reply_markup", t);
                }

                //-------------------]>

                if(fileId) {
                    result += genBodyField("text", "voice", fileId);

                    body = result;
                } else {
                    result += genBodyField("voice", fileName);

                    bodyBegin = result;
                    bodyEnd = "";
                }

                break;

            case "sendLocation":
                var t;

                body = genBodyField("text", "chat_id", data.chat_id);
                body += genBodyField("text", "latitude", data.latitude);
                body += genBodyField("text", "longitude", data.longitude);

                if(t = data.reply_to_message_id)
                    body += genBodyField("text", "reply_to_message_id", t);

                if(t = data.reply_markup) {
                    if(t && typeof(t) !== "string")
                        t = JSON.stringify(t);

                    body += genBodyField("json", "reply_markup", t);
                }

                break;

            case "sendChatAction":
                body = genBodyField("text", "chat_id", data.chat_id);
                body += genBodyField("text", "action", data.action);

                break;

            case "getUserProfilePhotos":
                var t;

                body = genBodyField("text", "user_id", data.user_id);

                if(t = data.offset)
                    body += genBodyField("text", "offset", t);

                if(t = data.limit)
                    body += genBodyField("text", "limit", t);

                break;

            case "getUpdates":
                if(!data) break;

                //------]>

                var t, result = "";

                if(t = data.offset)
                    result += genBodyField("text", "offset", t);

                if(t = data.limit)
                    result += genBodyField("text", "limit", t);

                if(t = data.timeout)
                    result += genBodyField("text", "timeout", t);

                if(result)
                    body = result;

                break;

            case "setWebhook":
                if(!data) break;

                //------]>

                var t, result,
                    certLikeStrKey;

                file = data.certificate;

                //---)>

                if(file) {
                    if(typeof(file) === "string") {
                        file = file.trim();

                        if(file[0] !== "." && file[0] !== "/" && file[1] !== ":") {
                            if(file[0] !== "-")
                                file = "-----BEGIN RSA PUBLIC KEY-----\r\n" + file + "\r\n-----END RSA PUBLIC KEY-----";

                            certLikeStrKey = file;
                            file = undefined;
                        }

                        fileName = data.name || file || "certificate.key";
                    } else {
                        fileName = data.name || "certificate.key";
                    }
                }

                //---)>

                if((t = data.url) && typeof(t) === "string") {
                    result = "https://api.telegram.org/bot" + token + "/setWebhook?url=";

                    if(!(/^https:\/\//i).test(t))
                        result += "https://";

                    t = result + t;
                    result = undefined;
                }

                result = genBodyField("text", "url", t || "");

                if(fileName)
                    result += genBodyField("certificate", fileName);

                if(certLikeStrKey)
                    result += certLikeStrKey;

                //---)>

                if(file) {
                    bodyBegin = result;
                    bodyEnd = "";
                } else {
                    body = result;
                }

                break;

            case "getMe":
                break;

            default:
                throw new Error("API method not found!")
        }

        //-------------------------]>

        req = request(method, callback);

        if(!body && !bodyBegin && !bodyEnd) {
            req.end();
            return;
        }

        //-------------------------]>

        if(body)
            body += genBodyField("end"); else bodyEnd += genBodyField("end");

        //-------------------------]>

        req.setHeader("Content-Type", "multipart/form-data; boundary=\"" + gBoundaryKey + "\"");

        if(body) {
            req.end(body);
        } else {
            req.write(bodyBegin);

            if(typeof(file) === "string")
                file = rFs.createReadStream(file);
            else
            if(file.closed) {
                req.end(bodyEnd);
                return;
            }

            file
                .on("error", function(error) {
                    req.end(bodyEnd);
                })
                .on("open", function() {

                })
                .on("end", function() {
                    req.end(bodyEnd);
                });

            file.pipe(req, gPipeOptions);
        }
    }

    function callAPIJson(method, data, callback) {
        return callAPI(method, data, cbCallAPI);

        function cbCallAPI(error, result, response) {
            if(result) {
                try {
                    result = JSON.parse(result);
                } catch(e) {
                    error = error || e;
                    result = null;
                }
            } else
                result = null;

            callback(error, result, response)
        }
    }

    //-----------[L2]----------}>

    function send(id, data, callback) {
        var defer;

        if(typeof(callback) !== "undefined")
            cbPromise(); else defer = new Promise(cbPromise);

        //-------------------------]>

        return defer;

        //-------------------------]>

        function cbPromise(resolve, reject) {
            var cmdName, cmdData;

            var cbEnd = callback ? callback : function(error, results) {
                if(error)
                    reject(error); else resolve(results);
            };

            //--------]>

            if(Array.isArray(data)) {
                var results = {};

                forEachAsync(data, function(next, d) {
                    call(d, function(error, body) {
                        var stack = results[cmdName] = results[cmdName] || [];
                        stack.push(body);

                        next(error, results);
                    });
                }, cbEnd);
            } else
                call(data, cbEnd);

            //--------]>

            function call(d, cb) {
                cmdName = getName(d);

                if(!cmdName)
                    throw new Error("Command not found!");

                cmdData = d[cmdName];
                cmdData = prepareDataForSendApi(id, cmdName, cmdData, d);

                callAPI(gMethodsMap[cmdName], cmdData, cb);
            }

            function getName(d) {
                var type,
                    len = gMMTypesLen;

                while(len--) {
                    type = gMMTypesKeys[len];

                    if(d.hasOwnProperty(type))
                        return type;
                }
            }
        }
    }

    //-----------[L3]----------}>

    function server(params, callback) {
        return createServer(this, params, callback);
    }

    function polling(params, callback) {
        if(typeof(params) === "function") {
            callback = params;
            params = undefined;
        }

        if(!params) {
            params = {};
        }

        params.interval = params.interval || 5;

        if(!callback)
            throw new Error("Polling without `callback`!");

        //----------------]>

        var api         = this.api,

            objBot      = createSrvBot(this, callback),
            tmPolling   = setInterval(load, 1000 * params.interval);

        objBot.stop = tmStop;

        //------)>

        if(params.firstLoad)
            load();

        //----------------]>

        return objBot;

        //----------------]>

        function load() {
            api
                .getUpdates(params)
                .then(JSON.parse)
                .then(onLoadSuccess, console.error);
        }

        function onLoadSuccess(data) {
            if(!data.ok)
                return;

            data.result.forEach(onMsg);

            function onMsg(data) {
                params.offset = data.update_id + 1;

                //--------]>

                var msg,
                    cmdParams, cmdFunc;

                var objCmds = objBot.commands;

                msg = data.message;

                //--------]>

                if(objBot.anTrack)
                    objBot.anTrack(msg);

                if(objCmds) {
                    cmdParams = parseCmd(msg.text);

                    if(cmdParams)
                        cmdFunc = objCmds[cmdParams.name];
                }

                if(cmdFunc || objBot.onMsg) {
                    var ctx = objBot.ctx;

                    ctx.from = ctx.id = msg.chat.id;
                    ctx.mid = msg.message_id;
                    ctx.data = {};

                    if(cmdFunc) {
                        cmdFunc.call(ctx, data, cmdParams);
                        return;
                    }

                    objBot.onMsg.call(ctx, data);
                }
            }
        }

        function tmStop() {
            clearInterval(tmPolling);
        }
    }

    //-------------------------]>

    function genApi() {
        var result = {};

        gApiMethods.forEach(add);

        function add(method) {
            result[method] = function(data, callback) {
                var defer;

                if(typeof(callback) !== "undefined")
                    cbPromise(); else defer = new Promise(cbPromise);

                //-------------------------]>

                return defer;

                //-------------------------]>

                function cbPromise(resolve, reject) {
                    if(!callback)
                        callback = function(error, body) {
                            if(error)
                                reject(error); else resolve(body);
                        };

                    callAPI(method, data, callback);
                }
            };
        }

        return result;
    }

    function getReadStreamByUrl(url, type, method, data, callback) {
        if(!(/^https?:\/\//).test(url))
            return false;

        createReadStreamByUrl(url, function(error, stream) {
            if(error) {
                if(callback)
                    callback(error);

                return;
            }

            var r = {};

            r[type] = stream;
            r.__proto__ = data;

            callAPI(method, r, callback);
        });

        return true;
    }
}

//-------------------------------------------]>

function forEachAsync(data, iter, cbEnd) {
    var i   = 0,
        len = data.length;

    run();

    function run() {
        iter(cbIter, data[i], i);
    }

    function cbIter(error, result) {
        if(error) {
            if(cbEnd) cbEnd(error);
            return;
        }

        i++;

        if(i >= len) {
            if(cbEnd)
                cbEnd(error, result);
        } else
            run();
    }
}

//---------------------------]>

function createReadStreamByUrl(url, callback) {
    url = rUrl.parse(url);

    var isSSL = url.protocol && (/^https/).test(url.protocol);
    var options = {
        "host": url.hostname,
        "port": url.port,
        "path": url.path
    };

    var request = (isSSL ? rHttps : rHttp).get(options);

    request
        .on("error", callback)
        .on("response", function(res) {
            callback(null, res);
        });
}

function prepareDataForSendApi(id, cmdName, cmdData, data) {
    data.chat_id = id;

    switch(typeof(cmdData)) {
        case "string":
            switch(cmdName) {
                case "message":
                    data.text = cmdData;

                    break;

                case "photo":
                case "audio":
                case "document":
                case "sticker":
                case "video":
                case "voice":
                    data[cmdName] = cmdData;

                    break;

                case "location":
                    cmdData = cmdData.split(/\s+/);

                    data.latitude = cmdData[0];
                    data.longitude = cmdData[1];

                    break;

                case "chatAction":
                    data.action = cmdData;

                    break;
            }

            break;

        case "object":
            switch(cmdName) {
                case "message":
                    if(cmdData && typeof(cmdData) === "object")
                        data.text = JSON.stringify(cmdData);

                    break;

                case "location":
                    if(Array.isArray(cmdData)) {
                        data.latitude = cmdData[0];
                        data.longitude = cmdData[1];
                    } else if(cmdData) {
                        data.latitude = cmdData.latitude;
                        data.longitude = cmdData.longitude;
                    }

                    break;

                default:
                    if(cmdData instanceof rStream.Stream) {
                        switch(cmdName) {
                            case "photo":
                            case "audio":
                            case "document":
                            case "sticker":
                            case "video":
                            case "voice":
                                data[cmdName] = cmdData;

                                break;
                        }
                    }
            }

            break;
    }

    return data;
}

//---------------------------]>

function createServer(botFather, params, callback) {
    if(typeof(params) === "function") {
        callback = params;
        params = undefined;
    }

    if(!params) {
        params = {"http": true};
    }

    params.port = params.port || 88;

    //----------)>

    var srv,
        srvBots,
        srvBotDefault = createSrvBot(botFather, callback);

    //----------)>

    if(params.http) {
        srv = rHttp.createServer(cbServer);
    } else {
        var certDir = params.certDir || "";

        var optKey  = rFs.readFileSync(certDir + params.key),
            optCert = rFs.readFileSync(certDir + params.cert),
            optCa   = params.ca;

        if(optCa) {
            if(Array.isArray(optCa)) {
                optCa = optCa.map(function(e) {
                    return rFs.readFileSync(certDir + e);
                });
            } else if(typeof(optCa) === "string") {
                optCa = certDir + optCa;
            }
        }

        var options = {
            "key":    optKey,
            "cert":   optCert,
            "ca":     optCa,

            "ciphers": [
                "ECDHE-RSA-AES256-SHA384",
                "DHE-RSA-AES256-SHA384",
                "ECDHE-RSA-AES256-SHA256",
                "DHE-RSA-AES256-SHA256",
                "ECDHE-RSA-AES128-SHA256",
                "DHE-RSA-AES128-SHA256",
                "HIGH",
                "!aNULL",
                "!eNULL",
                "!EXPORT",
                "!DES",
                "!RC4",
                "!MD5",
                "!PSK",
                "!SRP",
                "!CAMELLIA"
            ].join(":"),

            "honorCipherOrder":     true,

            "requestCert":          true,
            "rejectUnauthorized":   false
        };

        //------)>

        srv = rHttps.createServer(options, cbServer);
    }

    srv.listen(params.port, params.host, cbListen);

    //-----------------]>

    srvBotDefault.__proto__ = srv;

    srv = {
        "bot":      addBot
    };

    srv.__proto__ = srvBotDefault;

    //-----------------]>

    return srv;

    //-----------------]>

    function cbServer(req, res) {
        if(req.method !== "POST")
            return response();

        var firstChunk, chunks;

        //----------]>

        req
            .on("data", onData)
            .on("end", onEnd);

        //----------]>

        function onData(chunk) {
            if(!firstChunk)
                firstChunk = chunk;
            else {
                chunks = chunks || [firstChunk];
                chunks.push(chunk);
            }
        }

        function onEnd() {
            response();

            //--------]>

            var msg,
                cmdParams, cmdFunc,
                result;

            try {
                result = JSON.parse(chunks ? Buffer.concat(chunks) : firstChunk);
            } catch(e) {
                result = null;
            }

            if(!result)
                return;

            //--------]>

            var objBot  = srvBots && srvBots[req.url] || srvBotDefault,
                objCmds = objBot.commands;

            msg = result.message;

            //--------]>

            if(objBot.anTrack)
                objBot.anTrack(msg);

            if(objCmds) {
                cmdParams = parseCmd(msg.text);

                if(cmdParams)
                    cmdFunc = objCmds[cmdParams.name];
            }

            if(cmdFunc || objBot.onMsg) {
                var ctx = objBot.ctx;

                ctx.from = ctx.id = msg.chat.id;
                ctx.mid = msg.message_id;
                ctx.data = {};

                if(cmdFunc) {
                    cmdFunc.call(ctx, result, cmdParams, req);
                    return;
                }

                objBot.onMsg.call(ctx, result, req);
            }
        }

        function response(code) {
            res.writeHead(code || 200, {"Content-Type": "text/plain"});
            res.end("");
        }
    }

    function cbListen() {
        var host = srv.address().address;
        var port = srv.address().port;

        console.log("\n-----------------------------------------\n");
        console.log("> Server run: [%s://%s:%s]", params.http ? "http" : "https", host, port);
        console.log("> Date: %s", getTime());
        console.log("\n-----------------------------------------\n");

        process.on("SIGINT", function() {
            console.log("\n-----------------------------------------\n");
            console.log("> SIGINT");
            console.log("> Date: %s", getTime());
            console.log("\n-----------------------------------------\n");

            process.exit();
        });

        function getTime() {
            return new Date().toISOString().replace(/T/, " ").replace(/\..+/, "");
        }
    }

    //-----------------]>

    function addBot(bot, path, callback) {
        srvBots = srvBots || {};

        //-------------]>

        if(Object.prototype.hasOwnProperty.call(srvBots, path))
            return srvBots[path];

        //-------------]>

        srvBots[path] = bot = createSrvBot(bot, callback);

        if(params.host) {
            var url = params.host + ":" + params.port + path;

            bot.bot.api
                .setWebhook({"url": url, "certificate": params.selfSigned})

                .then(JSON.parse)
                .then(function(data) {
                    if(data.ok)
                        return;

                    console.log("Webhook: %s", url);
                    console.log(data.result);
                }, console.error);
        } else {
            console.log("[!] Warning | `host` not specified, Auto-Webhook not working")
        }

        return bot;
    }
}

//-----------------]>

function createSrvBot(bot, onMsg) {
    var ctx = {
        "data":     null,

        "send": function(callback) {
            var d = this.data;
            this.data = {};

            return bot.send(this.id, d, callback);
        },

        "forward": function(callback) {
            return bot.api.forwardMessage({
                "chat_id":      this.to,
                "from_chat_id": this.from,
                "message_id":   this.mid
            }, callback);
        }
    };

    ctx.__proto__ = bot;

    //-----------]>

    return {
        "bot":          bot,

        "anTrack":      null,
        "commands":     {},

        "ctx":          ctx,
        "onMsg":        onMsg,

        "analytics":    srvAnalytics,
        "command":      srvCommand
    };

    //-----------]>

    function srvAnalytics(apiKey, appName) {
        var rBotan = require("botanio");
        rBotan = rBotan(apiKey);

        this.anTrack = function(data) {
            return rBotan.track(data, appName || "Telegram Bot");
        };

        return this;
    }

    function srvCommand(name, callback) {
        this.commands[name] = callback;

        return this;
    }
}

//-----------------]>

function parseCmd(text) {
    if(!text || text[0] !== "/" && text[0] !== "@" || text.length === 1)
        return null;

    //---------]>

    var t,
        name, cmd, cmdText;

    switch(text[0]) {
        case "/":
            t = text.match(gReFindCmd);

            if(t) {
                cmd = t[1];
                cmdText = t[2];
            }

            break;

        case "@":
            text = text.replace(gReReplaceCmd, "");

            if(text[0] !== "/")
                return null;

            break;
    }

    if(!t) {
        t = text.split(gReSplitCmd, 2);

        cmd = t[0];
        cmdText = t[1];
    }

    //---------]>

    name = cmd.substr(1);

    return {
        "name": name,
        "text": cmdText || "",
        "cmd":  cmd
    };
}