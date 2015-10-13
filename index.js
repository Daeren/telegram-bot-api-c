//-----------------------------------------------------
//
// Author: Daeren
// Site: 666.io
//
//-----------------------------------------------------

"use strict";

//-----------------------------------------------------

var rHttp           = require("http"),
    rHttps          = require("https"),
    rUrl            = require("url"),
    rEvents         = require("events"),
    rFs             = require("fs"),
    rStream         = require("stream");

//-----------------------------------------------------

var gTgHostApi      = "api.telegram.org",
    gTgHostFile     = "api.telegram.org",
    gTgHostWebhook  = "api.telegram.org";

var gCRLF           = "\r\n";

var gPipeOptions    = {"end": false};
var gReqOptions     = {
    "host":         gTgHostApi,
    "method":       "POST"
};

var gReFindCmd      = /(^\/\S*?)@\S+\s*(.*)/,
    gReReplaceCmd   = /^@\S+\s/,
    gReSplitCmd     = /\s+([\s\S]+)?/,

    gReIsFilePath   = /[\\\/\.]/,

    gRePhotoExt     = /\.(jp[e]?g|[gt]if|png|bmp)$/i,
    gReAudioExt     = /\.(mp3)$/i,
    gReStickerExt   = /\.(jp[e]?g|[gt]if|png|bmp|webp)$/i,
    gReVideoExt     = /\.(mp4|mp4v|mpg4)$/i,
    gReVoiceExt     = /\.(ogg)$/i;

var gApiMethods     = [
    "getMe", "forwardMessage",
    "sendMessage", "sendPhoto", "sendAudio", "sendDocument", "sendSticker", "sendVideo", "sendVoice", "sendLocation", "sendChatAction",
    "getUserProfilePhotos", "getUpdates", "getFile",
    "setWebhook"
];

var gApiMethodsMap  = {
    "text":         "sendMessage",
    "photo":        "sendPhoto",
    "audio":        "sendAudio",
    "document":     "sendDocument",
    "sticker":      "sendSticker",
    "video":        "sendVideo",
    "voice":        "sendVoice",
    "location":     "sendLocation",
    "chatAction":   "sendChatAction"
};

var gMMTypesKeys    = Object.keys(gApiMethodsMap),
    gMMTypesLen     = gMMTypesKeys.length;

var gKeyboard       = compileKeyboard({
        "bin": {
            "ox": ["\u2B55\uFE0F", "\u274C"],
            "pn": ["\u2795", "\u2796"],
            "ud": ["\uD83D\uDD3C", "\uD83D\uDD3D"],
            "lr": ["\u25C0\uFE0F", "\u25B6\uFE0F"],
            "gb": ["\uD83D\uDC4D\uD83C\uDFFB", "\uD83D\uDC4E\uD83C\uDFFB"]
        },

        "norm": {
            "numpad": [
                ["7", "8", "9"],
                ["4", "5", "6"],
                ["1", "2", "3"],
                ["0"]
            ]
        },

        "ignore": {
            "hide": {"hide_keyboard": true}
        }
    });

//-----------------------------]>

main.keyboard = gKeyboard;
main.parseCmd = parseCmd;

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
        this.api        = genApi();
        this.keyboard   = gKeyboard;
    };

    CMain.prototype = {
        "setToken":     function(t) { token = t; return this; },

        "call":         callAPI,
        "callJson":     callAPIJson,

        "send":         send,
        "download":     download,

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
                if(value && typeof(value) !== "string")
                    value = JSON.stringify(value);

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
        if(!token || typeof(token) !== "string")
            throw new Error("Check the Access Token: " + token);

        //-------------------------]>

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

                if((t = data.text) && typeof(t) !== "undefined") {
                    if(t && typeof(t) === "object")
                        t = JSON.stringify(t);

                    body += genBodyField("text", "text", t);
                }

                if((t = data.parse_mode) && typeof(t) !== "undefined")
                    body += genBodyField("text", "parse_mode", t);

                if(data.disable_web_page_preview)
                    body += genBodyField("text", "disable_web_page_preview", "1");

                if(t = data.reply_to_message_id)
                    body += genBodyField("text", "reply_to_message_id", t);

                if(t = data.reply_markup)
                    body += genBodyField("json", "reply_markup", t);

                break;

            case "sendPhoto":
                var t, result;

                file = data.photo;

                if(!file) {
                    callback(new Error("Required: photo"));
                    return;
                }

                if(typeof(file) === "string") {
                    if(getReadStreamByUrl(file, "photo", method, data, callback))
                        return;

                    fileName = data.name || file;

                    if(!gReIsFilePath.test(fileName))
                        fileId = fileName;
                } else {
                    fileName = data.name || file.path || "file";
                }

                //-------------------]>

                result = genBodyField("text", "chat_id", data.chat_id);

                if(t = data.caption)
                    result += genBodyField("text", "caption", t);

                if(t = data.reply_to_message_id)
                    result += genBodyField("text", "reply_to_message_id", t);

                if(t = data.reply_markup)
                    result += genBodyField("json", "reply_markup", t);

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

                if(!file) {
                    callback(new Error("Required: audio"));
                    return;
                }

                if(typeof(file) === "string") {
                    if(getReadStreamByUrl(file, "audio", method, data, callback))
                        return;

                    fileName = data.name || file;

                    if(!gReIsFilePath.test(fileName))
                        fileId = fileName;
                } else {
                    fileName = data.name || file.path || "file";
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

                if(t = data.reply_markup)
                    result += genBodyField("json", "reply_markup", t);

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

                if(!file) {
                    callback(new Error("Required: document"));
                    return;
                }

                if(typeof(file) === "string") {
                    if(getReadStreamByUrl(file, "document", method, data, callback))
                        return;

                    fileName = data.name || file;

                    if(!gReIsFilePath.test(fileName))
                        fileId = fileName;
                } else {
                    fileName = data.name || file.path || "file";
                }

                //-------------------]>

                result = genBodyField("text", "chat_id", data.chat_id);

                if(t = data.reply_to_message_id)
                    result += genBodyField("text", "reply_to_message_id", t);

                if(t = data.reply_markup)
                    result += genBodyField("json", "reply_markup", t);

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

                if(!file) {
                    callback(new Error("Required: sticker"));
                    return;
                }

                if(typeof(file) === "string") {
                    if(getReadStreamByUrl(file, "document", method, data, callback))
                        return;

                    fileName = data.name || file;

                    if(!gReIsFilePath.test(fileName))
                        fileId = fileName;
                } else {
                    fileName = data.name || file.path || "file";
                }

                //-------------------]>

                result = genBodyField("text", "chat_id", data.chat_id);

                if(t = data.reply_to_message_id)
                    result += genBodyField("text", "reply_to_message_id", t);

                if(t = data.reply_markup)
                    result += genBodyField("json", "reply_markup", t);

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

                if(!file) {
                    callback(new Error("Required: video"));
                    return;
                }

                if(typeof(file) === "string") {
                    if(getReadStreamByUrl(file, "video", method, data, callback))
                        return;

                    fileName = data.name || file;

                    if(!gReIsFilePath.test(fileName))
                        fileId = fileName;
                } else {
                    fileName = data.name || file.path || "file";
                }

                //-------------------]>

                result = genBodyField("text", "chat_id", data.chat_id);

                if(t = data.duration)
                    result += genBodyField("text", "duration", t);

                if(t = data.caption)
                    result += genBodyField("text", "caption", t);

                if(t = data.reply_to_message_id)
                    result += genBodyField("text", "reply_to_message_id", t);

                if(t = data.reply_markup)
                    result += genBodyField("json", "reply_markup", t);

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

                if(!file) {
                    callback(new Error("Required: voice"));
                    return;
                }

                if(typeof(file) === "string") {
                    if(getReadStreamByUrl(file, "voice", method, data, callback))
                        return;

                    fileName = data.name || file;

                    if(!gReIsFilePath.test(fileName))
                        fileId = fileName;
                } else {
                    fileName = data.name || file.path || "file";
                }

                //-------------------]>

                result = genBodyField("text", "chat_id", data.chat_id);

                if(t = data.duration)
                    result += genBodyField("text", "duration", t);

                if(t = data.reply_to_message_id)
                    result += genBodyField("text", "reply_to_message_id", t);

                if(t = data.reply_markup)
                    result += genBodyField("json", "reply_markup", t);

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

                if(t = data.reply_markup)
                    body += genBodyField("json", "reply_markup", t);

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

            case "getFile":
                if(!data) break;

                //------]>

                var t;

                if(t = data.file_id)
                    body = genBodyField("text", "file_id", t);

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

                        fileName = data.name || file;
                    } else {
                        fileName = data.name || "file.key";
                    }
                }

                //---)>

                if((t = data.url) && typeof(t) === "string") {
                    result = "https://" + gTgHostWebhook + "/bot" + token + "/setWebhook?url=";

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
                throw new Error("API method not found!");
        }

        //-------------------------]>

        req = request(method, callback);

        if(!body && !bodyBegin && !bodyEnd) {
            req.end();
            return;
        }

        //-------------------------]>

        req.setHeader("Content-Type", "multipart/form-data; boundary=\"" + gBoundaryKey + "\"");

        //-------------------------]>

        if(body) {
            body += genBodyField("end");
            req.end(body);

            return;
        }

        bodyEnd += genBodyField("end");

        req.write(bodyBegin);

        if(typeof(file) === "string") {
            file = rFs.createReadStream(file);

            file.on("open", function() {
                file.pipe(req, gPipeOptions);
            });
        } else {
            if(file.closed) {
                req.end(bodyEnd);
                return;
            }

            file.pipe(req, gPipeOptions);
        }

        file
            .on("error", function(error) {
                req.end(bodyEnd);
            })
            .on("end", function() {
                req.end(bodyEnd);
            });
    }

    function callAPIJson(method, data, callback) {
        return callAPI(method, data, cbCallAPI);

        //-----------]>

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

            callback(error, result, response);
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

                callAPI(gApiMethodsMap[cmdName], cmdData, cb);
            }

            function getName(d) {
                var type,
                    len = gMMTypesLen;

                while(len--) {
                    type = gMMTypesKeys[len];

                    if(hasOwnProperty(d, type))
                        return type;
                }
            }
        }
    }

    function download(fid, dir, name, callback) {
        var defer;

        if(typeof(dir) === "function") {
            callback = dir;
            dir = undefined;
        } else if(typeof(name) === "function") {
            callback = name;
            name = undefined;
        }

        if(typeof(callback) !== "undefined")
            cbPromise(); else defer = new Promise(cbPromise);

        //-------------------------]>

        return defer;

        //-------------------------]>

        function cbPromise(resolve, reject) {
            var cbEnd = callback ? callback : function(error, results) {
                if(error)
                    reject(error); else resolve(results);
            };

            //--------]>

            callAPIJson("getFile", {"file_id": fid}, function(error, data) {
                if(error || !data) {
                    cbEnd(error || new Error("Problems with 'data'"), data);
                    return;
                }

                //--------]>

                var dataResult = data.result;

                var fileId      = dataResult.file_id,
                    fileSize    = dataResult.file_size,
                    filePath    = dataResult.file_path,
                    fileName    = filePath.split("/").pop();

                var url         = "https://" + gTgHostFile + "/file/bot" + token +"/" + filePath;

                if(name) {
                    fileName = fileName.match(/\.(.+)$/);
                    fileName = fileName && fileName[0] || "";
                } else
                    name = Date.now();

                //--------]>

                if(typeof(dir) === "undefined" || typeof(name) === "undefined") {
                    createReadStreamByUrl(url, function(error, response) {
                        if(error)
                            cbEnd(error);
                        else
                            cbEnd(null, {
                                "id":       fileId,
                                "size":     fileSize,
                                "file":     fileName,
                                "stream":   response
                            });
                    });

                    return;
                }

                //--------]>

                dir += name + fileName;

                var file = rFs.createWriteStream(dir);

                //--------]>

                file
                    .on("error", cbEnd)
                    .on("open", function() {
                        createReadStreamByUrl(url, function(error, response) {
                            if(error) {
                                cbEnd(error);
                                return;
                            }

                            response.pipe(file);
                        });
                    })
                    .on("finish", function() {
                        cbEnd(null, {
                            "id":   fileId,
                            "size": fileSize,
                            "file": dir
                        });
                    });
            });
        }
    }

    //-----------[L3]----------}>

    function server(params, callback) {
        return createServer(this, params, callback);
    }

    function polling(params, callback) {
        return createPolling(this, params, callback);
    }

    //-------------------------]>

    function genApi() {
        var result = {};

        gApiMethods.forEach(add);

        //--------------]>

        return result;

        //--------------]>

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
    }

    function getReadStreamByUrl(url, type, method, data, callback) {
        if(!(/^https?:\/\//).test(url))
            return false;

        createReadStreamByUrl(url, function(error, response) {
            var headers         = response.headers;

            var contentType     = headers["content-type"],
                contentLength   = headers["content-length"];

            //--------------]>

            if(!error && data.maxSize) {
                if(!contentLength)
                    error = new Error("Unknown size");
                else if(contentLength > data.maxSize)
                    error = new Error("maxSize");
            }

            if(error) {
                if(callback)
                    callback(error);

                return;
            }

            //--------------]>

            var r = Object.create(data);

            r[type] = response;

            if(!r.name && contentType && typeof(contentType) === "string") {
                switch(contentType) {
                    case "audio/mpeg":
                    case "audio/MPA":
                    case "audio/mpa-robust":
                        r.name = "audio.mp3";
                        break;

                    default:
                        r.name = contentType.replace("/", ".");
                }
            }

            callAPI(method, r, callback);
        });

        return true;
    }
}

//-------------------------------------------]>

function createServer(botFather, params, callback) {
    if(typeof(params) === "function") {
        callback = params;
        params = undefined;
    }

    if(!params) {
        params = {
            "host": "127.0.0.1",
            "http": true
        };
    }

    params.port = params.port || 88;

    //-----------------]>

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

    srv = Object.create(srvBotDefault);
    srv.bot = addBot;

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

            var data;

            var objBot      = srvBots && srvBots[req.url] || srvBotDefault,
                cbLogger    = objBot.cbLogger;

            data = chunks ? Buffer.concat(chunks) : firstChunk;

            //--------]>

            if(cbLogger)
                cbLogger(null, data);

            try {
                data = JSON.parse(data);
            } catch(e) {
                return;
            }

            //--------]>

            var upId    = data.update_id,
                msg     = data.message;

            //--------]>

            if(objBot.anTrack)
                objBot.anTrack(msg);

            //----)>

            var botFilters  = objBot.filters,

                ctx         = createCtx(),
                cmdParam,

                msgType     = getTypeMsg(msg),
                evName      = getEventNameByTypeMsg(msgType);

            //------------]>

            switch(evName) {
                case "text":
                    var rule;

                    //-----[CMD]----}>

                    cmdParam = parseCmd(msg.text);

                    if(cmdParam) {
                        rule = "/" + cmdParam.name;

                        if(callEvent(rule, cmdParam) || callEvent("/", cmdParam))
                            return;
                    }

                    //-----[RE]----}>

                    if(botFilters.regexp.s.length) {
                        var reParams;

                        rule = undefined;

                        for(var re, i = 0, len = botFilters.regexp.s.length; !rule && i < len; i++) {
                            re = botFilters.regexp.s[i];

                            if(reParams = msg.text.match(re))
                                rule = re;
                        }

                        if(rule) {
                            botFilters.ev.emit(re, ctx, reParams);
                            return;
                        }
                    }

                    break;
            }

            if(!evName || !callEvent(evName, msg[msgType])) {
                if(objBot.onMsg)
                    objBot.onMsg(ctx, cmdParam);
            }

            //------------]>

            function createCtx() {
                var result = Object.create(objBot.ctx);

                result.from = result.cid = msg.chat.id;
                result.mid = msg.message_id;

                result.update_id = upId;
                result.message = msg;

                result.data = {};

                return result;
            }

            function callEvent(type, params) {
                if(botFilters.ev.listenerCount(type)) {
                    botFilters.ev.emit(type, ctx, params);
                    return true;
                }

                return false;
            }
        }

        function response(code) {
            res.writeHead(code || 200);
            res.end();
        }
    }

    function cbListen() {
        var host = srv.address().address;
        var port = srv.address().port;

        console.log("\n-----------------------------------------\n");
        console.log("> Server run: [%s://%s:%s]", params.http ? "http" : "https", host, port);
        console.log("> Date: %s", getTime());
        console.log("\n-----------------------------------------\n");

        //-------]>

        process.on("SIGINT", function() {
            console.log("\n-----------------------------------------\n");
            console.log("> SIGINT");
            console.log("> Date: %s", getTime());
            console.log("\n-----------------------------------------\n");

            process.exit();
        });

        //-------]>

        function getTime() {
            return new Date().toISOString().replace(/T/, " ").replace(/\..+/, "");
        }
    }

    //-----------------]>

    function addBot(bot, path, callback) {
        srvBots = srvBots || {};

        //-------------]>

        if(hasOwnProperty(srvBots, path))
            return srvBots[path];

        //-------------]>

        srvBots[path] = bot = createSrvBot(bot, callback);

        if(params.address || params.host) {
            var url = (params.address || (params.host + ":" + params.port)) + path;

            bot
                .bot
                .api
                .setWebhook({"url": url, "certificate": params.selfSigned})

                .then(JSON.parse)
                .then(function(data) {
                    if(data.ok)
                        return;

                    console.log("Webhook: %s", url);
                    console.log(data.result);
                }, console.error);
        } else {
            console.log("[!] Warning | `address` and `host` not specified, Auto-Webhook not working");
        }

        return bot;
    }
}

function createPolling(botFather, params, callback) {
    if(typeof(params) === "function") {
        callback = params;
        params = undefined;
    }

    if(!params) {
        params = {};
    }

    params.interval = (parseInt(params.interval, 10) || 2) * 1000;

    //----------------]>

    var api         = botFather.api,

        objBot      = createSrvBot(botFather, callback),

        isStopped   = false,
        tmPolling;

    objBot.stop = tmStop;

    //------)>

    if(params.firstLoad)
        load(); else runTimer();

    //----------------]>

    return objBot;

    //----------------]>

    function runTimer() {
        if(isStopped)
            return;

        tmPolling = setTimeout(load, params.interval);
    }

    function load() {
        api.getUpdates(params, onParseUpdates);
    }

    function onParseUpdates(error, data) {
        if(objBot.cbLogger)
            objBot.cbLogger(error, data);

        if(!error) {
            try {
                data = JSON.parse(data);
            } catch(e) {
                error = e;
            }
        }

        if(error) {
            runTimer();
            return;
        }

        onLoadSuccess(data);
    }

    function onLoadSuccess(data) {
        if(!data.ok) {
            if(data.error_code === 409) {
                api.setWebhook(function() {
                    load();
                });
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
            var upId    = data.update_id,
                msg     = data.message;

            //--------]>

            params.offset = upId + 1;

            //--------]>

            if(objBot.anTrack)
                objBot.anTrack(msg);

            //----)>

            var botFilters  = objBot.filters,

                ctx         = createCtx(),
                cmdParam,

                msgType     = getTypeMsg(msg),
                evName      = getEventNameByTypeMsg(msgType);

            //------------]>

            switch(evName) {
                case "text":
                    var rule;

                    //-----[CMD]----}>

                    cmdParam = parseCmd(msg.text);

                    if(cmdParam) {
                        rule = "/" + cmdParam.name;

                        if(callEvent(rule, cmdParam) || callEvent("/", cmdParam))
                            return;
                    }

                    //-----[RE]----}>

                    if(botFilters.regexp.s.length) {
                        var reParams;

                        rule = undefined;

                        for(var re, i = 0, len = botFilters.regexp.s.length; !rule && i < len; i++) {
                            re = botFilters.regexp.s[i];

                            if(reParams = msg.text.match(re))
                                rule = re;
                        }

                        if(rule) {
                            botFilters.ev.emit(re, ctx, reParams);
                            return;
                        }
                    }

                    break;
            }

            if(!evName || !callEvent(evName, msg[msgType])) {
                if(objBot.onMsg)
                    objBot.onMsg(ctx, cmdParam);
            }

            //------------]>

            function createCtx() {
                var result = Object.create(objBot.ctx);

                result.from = result.cid = msg.chat.id;
                result.mid = msg.message_id;

                result.update_id = upId;
                result.message = msg;

                result.data = {};

                return result;
            }

            function callEvent(type, params) {
                if(botFilters.ev.listenerCount(type)) {
                    botFilters.ev.emit(type, ctx, params);
                    return true;
                }

                return false;
            }
        }
    }

    function tmStop() {
        isStopped = true;
        clearTimeout(tmPolling);
    }
}

//---------)>

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

    name = cmd.substr(1);

    //---------]>

    return {
        "name": name,
        "text": cmdText || "",
        "cmd":  cmd
    };
}

function getEventNameByTypeMsg(type) {
    switch(type) {
        case "new_chat_participant":    return "enterChat";
        case "left_chat_participant":   return "leftChat";

        case "new_chat_title":          return "chatTitle";
        case "new_chat_photo":          return "chatNewPhoto";
        case "delete_chat_photo":       return "chatDeletePhoto";
        case "group_chat_created":      return "chatCreated";

        default:
            return type;
    }
}

function getTypeMsg(m) {
    var t;

    hasOwnProperty(m, t = "text") ||
    hasOwnProperty(m, t = "photo") ||
    hasOwnProperty(m, t = "audio") ||
    hasOwnProperty(m, t = "document") ||
    hasOwnProperty(m, t = "sticker") ||
    hasOwnProperty(m, t = "video") ||
    hasOwnProperty(m, t = "voice") ||
    hasOwnProperty(m, t = "contact") ||
    hasOwnProperty(m, t = "location") ||

    hasOwnProperty(m, t = "new_chat_participant") ||
    hasOwnProperty(m, t = "left_chat_participant") ||
    hasOwnProperty(m, t = "new_chat_title") ||
    hasOwnProperty(m, t = "new_chat_photo") ||
    hasOwnProperty(m, t = "delete_chat_photo") ||
    hasOwnProperty(m, t = "group_chat_created") ||

    (t = undefined);

    return t;
}

//---------------------------]>

function createReadStreamByUrl(url, callback) {
    url = rUrl.parse(url);

    if(!url.protocol || !(/^http/).test(url.protocol)) {
        callback(new Error("Use the links only with HTTP/HTTPS protocol"));
        return;
    }

    var isSSL = url.protocol === "https:";
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
                case "location":
                    cmdData = cmdData.split(/\s+/);

                    data.latitude = cmdData[0];
                    data.longitude = cmdData[1];

                    break;

                case "chatAction":
                    data.action = cmdData;

                    break;

                default:
                    data[cmdName] = cmdData;

                    break;
            }

            break;

        case "object":
            switch(cmdName) {
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

//---------)>

function createSrvBot(bot, onMsg) {
    var result,

        ctx = Object.create(bot),
        ev  = new rEvents();

    //--------------]>

    ctx.send = function(callback) {
        var d = this.data;
        this.data = {};

        return bot.send(this.cid, d, callback);
    };

    ctx.forward = function(callback) {
        return bot.api.forwardMessage({
            "chat_id":      this.to,
            "from_chat_id": this.from,
            "message_id":   this.mid
        }, callback);
    };

    //--------------]>

    result = {
        "bot":          bot,

        "ctx":          ctx,
        "filters":      {
            "ev":           ev,
            "regexp":       {"m": {}, "s": []}
        },

        "on":           evOn,
        "off":          evOff,

        "onMsg":        onMsg,

        "cbLogger":     null,
        "anTrack":      null,

        "logger":       srvLogger,
        "analytics":    srvAnalytics
    };

    ev.setMaxListeners(100);

    //-----------]>

    return result;

    //-----------]>

    function evOn(rule, func) {
        if(Array.isArray(rule)) {
            rule.forEach(function(e) {
                evOn(e, func);
            });

            return result;
        }

        //------]>

        var fltEv   = result.filters.ev,
            fltRe   = result.filters.regexp;

        switch(typeof(rule)) {
            case "string":
                fltEv.on(rule, func);
                break;

            case "object":
                if(rule instanceof RegExp) {
                    fltEv.on(rule, func);

                    if(!fltRe.m[rule]) {
                        fltRe.m[rule] = true;
                        fltRe.s.push(rule);
                    }
                } else
                    throw new Error("Unknown rule: " + rule);

                break;

            default:
                throw new Error("Unknown rule: " + rule);
        }

        return result;
    }

    function evOff(rule, func) {
        if(Array.isArray(rule)) {
            rule.forEach(function(e) {
                evOff(e, func);
            });

            return result;
        }

        //------]>

        var filters = result.filters;

        var fltEv   = filters.ev,
            fltRe   = filters.regexp;

        //------]>

        if(arguments.length && !fltEv.listenerCount(rule))
            return result;

        //------]>

        if(arguments.length <= 1) {
            if(arguments.length) {
                switch(typeof(rule)) {
                    case "object":
                        if(rule instanceof RegExp)
                            removeFltRegExp(getIdFltRegExp(rule));

                        break;
                }
            } else {
                filters.regexp = {"m": {}, "s": []};
            }

            ev.removeAllListeners(rule);

            return result;
        }

        //------]>

        switch(typeof(rule)) {
            case "string":
                fltEv.removeListener(rule, func);
                break;

            case "object":
                if(rule instanceof RegExp) {
                    var id = getIdFltRegExp(rule);

                    if(id >= 0) {
                        fltEv.removeListener(rule, func);

                        if(!fltEv.listenerCount(rule))
                            removeFltRegExp(id);
                    }
                }

                break;
        }

        //------]>

        return result;

        //------]>

        function getIdFltRegExp(id) {
            return fltRe.s.indexOf(id);
        }

        function removeFltRegExp(id) {
            if(id >= 0) {
                delete fltRe.m[fltRe.s[id]];
                fltRe.s.splice(id, 1);

                return true;
            }

            return false;
        }
    }

    function srvLogger(callback) {
        result.cbLogger = callback;

        return result;
    }

    function srvAnalytics(apiKey, appName) {
        var rBotan = require("botanio");
        rBotan = rBotan(apiKey);

        result.anTrack = function(data) {
            return rBotan.track(data, appName || "Telegram Bot");
        };

        return result;
    }
}

function compileKeyboard(input) {
    var result,
        map = {};

    //----------]>

    result = function(buttons, params) {
        buttons = {"keyboard": buttons};

        if(!params)
            return buttons;

        if(!Array.isArray(params))
            params = params.split(/\s+/);

        if(params.indexOf("resize") !== -1)
            buttons.resize_keyboard = true;

        if(params.indexOf("once") !== -1)
            buttons.one_time_keyboard = true;

        if(params.indexOf("selective") !== -1)
            buttons.selective = true;

        return buttons;
    };

    //----------]>

    for(var name in input.bin) {
        var kb = input.bin[name];

        name = name[0].toUpperCase() + name.substr(1);

        map["v" + name] = kb.map(function(x) { return [x]; });
        map["h" + name] = [kb];
    }

    for(var name in map) {
        var kb = map[name];

        result[name] = {"keyboard": kb, "resize_keyboard": true};
        result[name + "Once"] = {"keyboard": kb, "resize_keyboard": true, "one_time_keyboard": true};
    }

    for(var name in input.norm) {
        var kb = input.norm[name];

        result[name] = {"keyboard": kb};
        result[name + "Once"] = {"keyboard": kb, "one_time_keyboard": true};
    }

    for(var name in input.ignore) {
        var kb = input.ignore[name];
        result[name] = kb;
    }

    //----------]>

    return result;
}

//---------------------------]>

function hasOwnProperty(obj, prop) {
    return Object.prototype.hasOwnProperty.call(obj, prop);
}

function forEachAsync(data, iter, cbEnd) {
    var i   = 0,
        len = data.length;

    //---------]>

    run();

    //---------]>

    function run() {
        iter(cbNext, data[i], i);
    }

    function cbNext(error, result) {
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
