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

var gReReplaceName  = /^@\S+\s+/,

    gReFindCmd      = /(^\/\S*?)@\S+\s*(.*)/,
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

if(!module.parent)
    require("./src/cli");

//-----------------------------------------------------

function main(token) {
    var gBoundaryKey, gBoundaryDiv, gBoundaryEnd,

        gBoundaryUDate,
        gBoundaryUIntr  = 1000 * 60 * 5;

    //---------)>

    updateBoundary();

    //---------)>

    var CMain = function() {
        this.api        = genApiMethods();
        this.keyboard   = gKeyboard;
    };

    CMain.prototype = {
        "setToken":     function(t) { token = t; return this; },

        "call":         callAPI,
        "callJson":     callAPIJson,

        "send":         mthCMainSend,
        "download":     mthCMainDownload,

        "server":       function(params, callback) { return createServer(this, params, callback); },
        "polling":      function(params, callback) { return createPolling(this, params, callback); },

        "parseCmd":     parseCmd
    };

    //-------------------------]>

    return new CMain();

    //-------------------------]>

    function genApiMethods() {
        var result = {};

        gApiMethods.forEach(add);

        //--------------]>

        return result;

        //--------------]>

        function add(method) {
            result[method] = function(data, callback) {
                var defer,
                    argsLen = arguments.length;

                if(argsLen > 1)
                    cbPromise(); else defer = new Promise(cbPromise);

                //-------------------------]>

                return defer;

                //-------------------------]>

                function cbPromise(resolve, reject) {
                    if(argsLen < 2) {
                        callback = function(error, body) {
                            if(error)
                                reject(error); else resolve(body);
                        };
                    }

                    if(typeof(callback) !== "function")
                        throw new Error("API [" + method + "]: `callback` not specified");

                    callAPIJson(method, data, function(error, data) {
                        error = error || genErrorByTgResponse(data);

                        if(!error)
                            data = data.result;

                        callback(error, data);
                    });
                }
            };
        }
    }

    //-----------[L0]----------}>

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
                if(typeof(value) !== "string")
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

    //-----------[L1]----------}>

    function callAPI(method, data, callback) {
        if(!token || typeof(token) !== "string")
            throw new Error("callAPI | Forbidden. Check the Access Token: " + token + " [" + method + "]");

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

        req = tgApiRequest(token, method, callback);

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
            .on("error", function() {
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
            } else {
                error = error || new Error("Empty: `result`");
                result = null;
            }

            callback(error, result, response);
        }
    }

    //-----------[L2]----------}>

    function mthCMainSend(id, data, callback) {
        var defer;
        var self = this;

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

                self.api[gApiMethodsMap[cmdName]](cmdData, cb);
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

    function mthCMainDownload(fid, dir, name, callback) {
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
                error = error || genErrorByTgResponse(data);

                //--------]>

                if(error) {
                    cbEnd(error, data);
                    return;
                }

                //--------]>

                var dataResult  = data.result;

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
}

//-------------------------------------------]>

function createServer(botFather, params, callback) {
    if(typeof(params) === "function") {
        callback = params;
        params = undefined;
    }

    params = params || {
        "host": "127.0.0.1",
        "http": true
    };

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

    return (function() {
        var result = Object.create(srvBotDefault);

        result.app = srv;
        result.bot = addBot;

        return result;
    })();

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
            if(!firstChunk) {
                firstChunk = chunk;
            } else {
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

            srvOnMsg(objBot, data);
        }

        //-------)>

        function response(code) {
            res.writeHead(code || 200);
            res.end();
        }
    }

    function cbListen() {
        var host = srv.address().address;
        var port = srv.address().port;

        //-------]>

        onAction(null, "START");

        process.on("SIGINT", onAction);
        process.on("uncaughtException", onAction);

        //-------]>

        function onAction(error, evName) {
            evName = evName || "STOP";

            console.log("\n+---[%s]------------------------------------".slice(0, -1 * evName.length), evName);
            console.log("|");
            console.log("| Server: [%s]", getAddress());
            console.log("| Date: %s", getTime());
            console.log("+-----------------------------------------\n");

            if(error) {
                console.error(error.stack);
            }

            if(evName === "STOP")
                process.exit();
        }

        //---)>

        function getAddress() {
            return (params.http ? "http" : "https") + "://" + (host || "*") + ":" + port;
        }

        function getTime() {
            return new Date().toISOString().replace(/T/, " ").replace(/\..+/, "");
        }
    }

    //-----------------]>

    function addBot(bot, path, callback) {
        var srvBot;

        //-------------]>

        srvBots = srvBots || {};

        if(hasOwnProperty(srvBots, path))
            throw new Error("Path '" + path + "' has already been used");

        //-------------]>

        srvBots[path] = srvBot = createSrvBot(bot, callback);

        if(typeof(params.autoWebhook) === "undefined" || typeof(params.autoWebhook) === "string" && params.autoWebhook) {
            if(params.autoWebhook || params.host) {
                var url = (params.autoWebhook || (params.host + ":" + params.port)) + path;

                srvBot
                    .bot
                    .callJson(
                        "setWebhook", {"url": url, "certificate": params.selfSigned},
                        function(error, isOk) {
                            if(isOk)
                                return;

                            console.log("[-] Webhook: %s", url);

                            if(error)
                                console.log(error);
                        }
                    );
            } else {
                console.log("[!] Warning | `autoWebhook` and `host` not specified, autoWebhook not working");
            }
        }

        return srvBot;
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

    var objBot      = createSrvBot(botFather, callback),

        isStopped   = false,
        tmPolling;

    //------)>

    if(params.firstLoad)
        load(); else runTimer();

    //----------------]>

    return (function() {
        var result = Object.create(objBot);

        result.start = tmStart;
        result.stop = tmStop;

        return result;
    })();

    //----------------]>

    function load() {
        botFather.callJson("getUpdates", params, onParseUpdates);
    }

    //-------)>

    function onParseUpdates(error, data) {
        if(objBot.cbLogger)
            objBot.cbLogger(error, data);

        if(error) {
            runTimer();
            return;
        }

        //--------]>

        onLoadSuccess(data);
    }

    function onLoadSuccess(data) {
        if(!data.ok) {
            if(data.error_code === 409)
                botFather.callJson("setWebhook", null, load); else runTimer();

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

            srvOnMsg(objBot, data);
        }
    }

    //----------]>

    function runTimer() {
        if(isStopped)
            return;

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

//----)>

function srvOnMsg(objBot, data) {
    var msg     = data.message,
        msgChat = msg.chat;

    //--------]>

    if(objBot.anTrack)
        objBot.anTrack(msg);

    //----)>

    var botMiddleware   = objBot.middleware,
        botFilters      = objBot.filters,

        ctxBot          = createCtx(),
        cmdParam,

        msgType         = getTypeMsg(msg),
        evName          = getEventNameByTypeMsg(msgType);

    //------------]>

    forEachAsync(botMiddleware, onIterMiddleware, onEndMiddleware);

    //------------]>

    function onIterMiddleware(next, middleware) {
        middleware(evName, ctxBot, next);
    }

    function onEndMiddleware() {
        switch(evName) {
            case "text":
                var rule, len;

                //-----[Filter: botName]----}>

                if(!msg.reply_to_message && msgChat.id < 0 && msgChat.type === "group") {
                    var msgText = msg.text;

                    if(msgText[0] === "@")
                        msg.text = msgText.replace(gReReplaceName, "");
                }

                //-----[CMD]----}>

                cmdParam = parseCmd(msg.text);

                if(cmdParam) {
                    rule = "/" + cmdParam.name;

                    if(callEvent(rule, cmdParam) || callEvent("/", cmdParam))
                        return;
                }

                //-----[RE]----}>

                len = botFilters.regexp.length;

                if(len) {
                    var reParams;

                    rule = undefined;

                    for(var re, i = 0; !rule && i < len; i++) {
                        re = botFilters.regexp[i];
                        reParams = msg.text.match(re.rule);

                        if(reParams) {
                            rule = re.rule;

                            if(rule && re.binds) {
                                var result  = {},
                                    binds   = re.binds;

                                for(var j = 0, jLen = Math.min(reParams.length - 1, binds.length); j < jLen; j++) {
                                    result[binds[j]] = reParams[j + 1];
                                }

                                reParams = result;
                            }
                        }
                    }

                    if(rule) {
                        botFilters.ev.emit(rule, ctxBot, reParams);
                        return;
                    }
                }

                break;
        }

        if(!evName || !callEvent(evName, msg[msgType])) {
            if(objBot.onMsg)
                objBot.onMsg(ctxBot, cmdParam);
        }

        //-------]>

        function callEvent(type, params) {
            if(botFilters.ev.listenerCount(type)) {
                botFilters.ev.emit(type, ctxBot, params);
                return true;
            }

            return false;
        }
    }

    //-------)>

    function createCtx() {
        var result = Object.create(objBot.ctx);

        result.from = result.cid = msgChat.id;
        result.mid = msg.message_id;

        result.message = msg;
        result.data = {};

        return result;
    }
}

//---------]>

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
            text = text.replace(gReReplaceName, "");

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
    var urlObj = rUrl.parse(url);

    if(!urlObj.protocol || !(/^http/).test(urlObj.protocol)) {
        callback(new Error("Use the links only with HTTP/HTTPS protocol"));
        return;
    }

    var isHTTPS = urlObj.protocol === "https:";
    var options = {
        "host": urlObj.hostname,
        "port": urlObj.port,
        "path": urlObj.path,

        "headers": {
            "User-Agent":   "TgBotApic",
            "Referer":      url
        }
    };

    //-----------]>

    var request = (isHTTPS ? rHttps : rHttp).get(options);

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

//---------]>

function createSrvBot(bot, onMsg) {
    var result,

        ctx = Object.create(bot),
        ev = new rEvents();

    ev.setMaxListeners(100);

    //--------------]>

    result = {
        "bot": bot,
        "ctx": ctx,

        "middleware": [],

        "filters": {
            "ev": ev,
            "regexp": []
        },

        "cbLogger": null,
        "anTrack": null,

        //-----)>

        "use": srvUse,

        "on": srvEvOn,
        "off": srvEvOff,

        "logger": srvLogger,
        "analytics": srvAnalytics,

        //-----)>

        "onMsg": onMsg
    };

    //-----)>

    ctx.send = ctxSend;
    ctx.forward = ctxForward;

    //-----------]>

    return result;

    //-----------]>

    function ctxSend(callback) {
        var d = this.data;
        this.data = {};

        return bot.send(this.cid, d, callback);
    }

    function ctxForward(callback) {
        var data = {
            "chat_id":      this.to,
            "from_chat_id": this.from,
            "message_id":   this.mid
        };

        return arguments.length < 2 ? bot.api.forwardMessage(data) : bot.api.forwardMessage(data, callback);
    }

    //-----)>

    function srvUse(f) {
        result.middleware.push(f);
        return result;
    }

    function srvEvOn(rule, params, func) {
        if(typeof(params) === "function") {
            func = params;
            params = undefined;
        }

        //------]>

        if(typeof(rule) === "string") {
            var t = rule.split(/\s+/);

            if(t.length > 1)
                rule = t;
        }

        //---)>

        if(Array.isArray(rule)) {
            rule.forEach(function(e) {
                srvEvOn(e, params, func);
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
                    if(!fltEv.listenerCount(rule)) {
                        if(params) {
                            if(typeof(params) === "string")
                                params = params.split(/\s+/);

                            if(!Array.isArray(params))
                                throw new Error("on | RegExp | `params` is not an array");
                        }

                        fltRe.push({
                            "rule":     rule,
                            "binds":    params
                        });
                    }

                    fltEv.on(rule, func);

                    break;
                }

            default:
                throw new Error("Unknown rule: " + rule);
        }

        return result;
    }

    function srvEvOff(rule, func) {
        if(Array.isArray(rule)) {
            rule.forEach(function(e) {
                srvEvOff(e, func);
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
                filters.regexp = [];
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

        function getIdFltRegExp(obj) {
            for(var i = 0, len = fltRe.length; i < len; i++)
                if(fltRe[i].rule === obj) return i;

            return -1;
        }

        function removeFltRegExp(id) {
            if(id >= 0) {
                fltRe.splice(id, 1);
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
        if(typeof(buttons) === "string")
            buttons = buttons.split(/\s+/).map(function(x) { return [x]; });

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

//-------------[HELPERS]--------------}>

function tgApiRequest(token, method, callback) {
    if(!method)
        throw new Error("request: `method` was not specified");

    gReqOptions.path = "/bot" + token + "/" + method;

    //--------------]>

    var req = rHttps.request(gReqOptions, cbRequest);

    if(typeof(callback) === "function") {
        req.on("error", callback);
    }

    //--------------]>

    return req;

    //--------------]>

    function cbRequest(response) {
        var firstChunk, chunks;

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
            callback(null, chunks ? Buffer.concat(chunks) : firstChunk, response);
        });
    }
}

//----------]>

function genErrorByTgResponse(data) {
    if(data && !data.ok) {
        var error = new Error(data.description);
        error.code = data.error_code;

        return error;
    }
}

//----------]>

function hasOwnProperty(obj, prop) {
    return Object.prototype.hasOwnProperty.call(obj, prop);
}

function forEachAsync(data, iter, cbEnd) {
    var i   = 0,
        len = data.length;

    //---------]>

    if(len) run();
    else if(cbEnd) cbEnd();

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
