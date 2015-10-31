//-----------------------------------------------------
//
// Author: Daeren
// Site: 666.io
//
//-----------------------------------------------------

"use strict";

//-----------------------------------------------------

const rHttp         = require("http"),
      rHttps        = require("https"),
      rUrl          = require("url"),
      rEvents       = require("events"),
      rFs           = require("fs"),
      rStream       = require("stream"),
      rPath         = require("path");

//-----------------------------------------------------

const gTgHostApi      = "api.telegram.org",
      gTgHostFile     = "api.telegram.org",
      gTgHostWebhook  = "api.telegram.org";

const gCRLF           = "\r\n";

const gPipeOptions    = {"end": false};
const gReqOptions     = {
    "host":         gTgHostApi,
    "method":       "POST"
};

const gReReplaceName  = /^@\S+\s+/,

      gReFindCmd      = /(^\/\S*?)@\S+\s*(.*)/,
      gReSplitCmd     = /\s+([\s\S]+)?/,

      gReIsFilePath   = /[\\\/\.]/;

const gApiMethods     = [
    "getMe", "forwardMessage",
    "sendMessage", "sendPhoto", "sendAudio", "sendDocument", "sendSticker", "sendVideo", "sendVoice", "sendLocation", "sendChatAction",
    "getUserProfilePhotos", "getUpdates", "getFile",
    "setWebhook"
];

const gApiMethodsMap  = {
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

const gMMTypesKeys    = Object.keys(gApiMethodsMap),
      gMMTypesLen     = gMMTypesKeys.length;

const gKeyboard       = compileKeyboard({
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
    let gBoundaryKey, gBoundaryDiv, gBoundaryEnd,

        gBoundaryUDate,
        gBoundaryUIntr  = 1000 * 60 * 5;

    //---------)>

    updateBoundary();

    //---------)>

    const CMain = function() {
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
        let result = {};

        gApiMethods.forEach(add);

        //--------------]>

        return result;

        //--------------]>

        function add(method) {
            result[method] = function(data, callback) {
                const argsLen = arguments.length;

                let defer;

                //---------]>

                if(argsLen === 1 && typeof(data) === "function") {
                    callback = data;
                }

                if(typeof(callback) === "function")
                    cbPromise(); else defer = new Promise(cbPromise);

                //-------------------------]>

                return defer;

                //-------------------------]>

                function cbPromise(resolve, reject) {
                    if(typeof(callback) !== "function") {
                        callback = function(error, body) {
                            if(error)
                                reject(error); else resolve(body);
                        };
                    }

                    if(typeof(callback) !== "function")
                        throw new Error("API [" + method + "]: `callback` not specified");

                    callAPIJson(method, data, function(error, data) {
                        error = error || genErrorByTgResponse(data) || null;

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
        let redirectCount = 3;

        if(!(/^https?:\/\//).test(url))
            return false;

        create();

        //--------------]>

        return true;

        //--------------]>

        function create() {
            createReadStreamByUrl(url, function(error, response) {
                if(error) {
                    if(callback)
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

                    create();

                    return;
                }

                //-----[Filters]-----}>

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

                let result = Object.create(data);
                result[type] = response;

                //-----[API]-----}>

                callAPI(method, result, callback);
            });
        }
    }

    //-----------[L1]----------}>

    function callAPI(method, data, callback) {
        if(!token || typeof(token) !== "string")
            throw new Error("callAPI | Forbidden. Check the Access Token: " + token + " [" + method + "]");

        //-------------------------]>

        let t, result;

        let req,
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
                if(fileProcessing("photo"))
                    return;

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
                }

                break;

            case "sendAudio":
                if(fileProcessing("audio"))
                    return;

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
                }

                break;

            case "sendDocument":
                if(fileProcessing("document"))
                    return;

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
                }

                break;

            case "sendSticker":
                if(fileProcessing("sticker"))
                    return;

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
                }

                break;

            case "sendVideo":
                if(fileProcessing("video"))
                    return;

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
                }

                break;

            case "sendVoice":
                if(fileProcessing("voice"))
                    return;

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
                }

                break;

            case "sendLocation":
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
                body = genBodyField("text", "user_id", data.user_id);

                if(t = data.offset)
                    body += genBodyField("text", "offset", t);

                if(t = data.limit)
                    body += genBodyField("text", "limit", t);

                break;

            case "getUpdates":
                if(!data) break;

                //------]>

                result = "";

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

                if(t = data.file_id)
                    body = genBodyField("text", "file_id", t);

                break;

            case "setWebhook":
                if(!data) break;

                //------]>

                let certLikeStrKey;

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

        if(!body && !bodyBegin) {
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

        //-------[File: init]-------}>

        bodyEnd = genBodyField("end");

        req.write(bodyBegin);

        //-------[File: stream]-------}>

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

        //-------------------------]>

        function fileProcessing(type) {
            file = data[type];

            //--------]>

            if(!file) {
                callback(new Error("Required: " + type));
                return true;
            }

            if(typeof(file) === "string") {
                if(getReadStreamByUrl(file, type, method, data, callback))
                    return true;

                fileName = data.name || file;

                if(!gReIsFilePath.test(fileName))
                    fileId = fileName;
            } else if(typeof(file) === "object" && file.headers) {
                fileName = data.name || getNameByMime(file.headers["content-type"]) || "file";
            } else {
                fileName = data.name || file.path || "file";
            }

            //--------]>

            if(fileName)
                fileName = rPath.basename(fileName);

            //--------]>

            return false;
        }
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
        const self = this;

        let defer;

        if(typeof(callback) !== "undefined")
            cbPromise(); else defer = new Promise(cbPromise);

        //-------------------------]>

        return defer;

        //-------------------------]>

        function cbPromise(resolve, reject) {
            let cmdName, cmdData;

            const cbEnd = callback ? callback : function(error, results) {
                if(error)
                    reject(error); else resolve(results);
            };

            //--------]>

            if(Array.isArray(data)) {
                let results = {};

                forEachAsync(data, function(next, d) {
                    call(d, function(error, body) {
                        let stack = results[cmdName] = results[cmdName] || [];
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
                let type,
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
        let defer;

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
            const cbEnd = callback ? callback : function(error, results) {
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

                const dataResult  = data.result;

                const fileId      = dataResult.file_id,
                      fileSize    = dataResult.file_size,
                      filePath    = dataResult.file_path;

                const url         = "https://" + gTgHostFile + "/file/bot" + token +"/" + filePath;

                let fileName      = filePath.split("/").pop();

                //--------]>

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

                //---)>

                const file = rFs.createWriteStream(dir);

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

    const isHTTPS       = !params.http;
    const srvBotDefault = createSrvBot(botFather, callback);

    let srv, srvBots;

    //----------)>

    if(isHTTPS) {
        const certDir = params.certDir || "";

        const optKey  = rFs.readFileSync(certDir + params.key),
              optCert = rFs.readFileSync(certDir + params.cert);

        let optCa     = params.ca;

        //------)>

        if(optCa) {
            if(Array.isArray(optCa)) {
                optCa = optCa.map(function(e) {
                    return rFs.readFileSync(certDir + e);
                });
            } else if(typeof(optCa) === "string") {
                optCa = certDir + optCa;
            }
        }

        //------)>

        const options = {
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

        //---------]>

        srv = rHttps.createServer(options, cbServer);
    } else {
        srv = rHttp.createServer(cbServer);
    }

    srv.listen(params.port, params.host, cbListen);

    //-----------------]>

    return (function() {
        let result = Object.create(srvBotDefault);

        result.app = srv;
        result.bot = addBot;

        return result;
    })();

    //-----------------]>

    function cbServer(req, res) {
        if(req.method !== "POST")
            return response();

        let firstChunk, chunks;

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

            const objBot      = srvBots && srvBots[req.url] || srvBotDefault,
                  cbLogger    = objBot.cbLogger;

            let data    = chunks ? Buffer.concat(chunks) : firstChunk,
                error   = null;

            //--------]>

            try {
                data = JSON.parse(data);
            } catch(e) {
                error = e;
            }

            //--------]>

            if(cbLogger)
                cbLogger(error, data);

            if(error)
                return;

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
        const host = srv.address().address,
              port = srv.address().port;

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
        let srvBot;

        //-------------]>

        srvBots = srvBots || {};

        if(hasOwnProperty(srvBots, path))
            throw new Error("Path '" + path + "' has already been used");

        //-------------]>

        srvBots[path] = srvBot = createSrvBot(bot, callback);

        if(typeof(params.autoWebhook) === "undefined" || typeof(params.autoWebhook) === "string" && params.autoWebhook) {
            if(params.autoWebhook || params.host) {
                const url = (params.autoWebhook || (params.host + ":" + params.port)) + path;

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

    const objBot = createSrvBot(botFather, callback);

    let isStopped = false,
        tmPolling;

    //------)>

    if(params.firstLoad)
        load(); else runTimer();

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
            if(objBot.cbLogger)
                objBot.cbLogger(error, data);

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
    const msg     = data.message,
          msgChat = msg.chat;

    //--------]>

    if(objBot.anTrack)
        objBot.anTrack(msg);

    //----)>

    const botPlugin       = objBot.plugin,
          botFilters      = objBot.filters,

          ctxBot          = createCtx(),

          msgType         = getTypeMsg(msg),
          evName          = getEventNameByTypeMsg(msgType);

    let cmdParam;

    //------------]>

    forEachAsync(botPlugin, onIterPlugin, onEndPlugin);

    //------------]>

    function onIterPlugin(next, plugin) {
        plugin(evName, ctxBot, function() { next(); });
    }

    function onEndPlugin() {
        switch(evName) {
            case "text":
                let rule, len;

                //-----[Filter: botName]----}>

                if(!msg.reply_to_message && msgChat.id < 0 && msgChat.type === "group") {
                    let msgText = msg.text;

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
                    let reParams;

                    rule = undefined;

                    for(let re, i = 0; !rule && i < len; i++) {
                        re = botFilters.regexp[i];
                        reParams = msg.text.match(re.rule);

                        if(reParams) {
                            rule = re.rule;

                            if(rule && re.binds) {
                                let result  = {},
                                    binds   = re.binds;

                                for(let j = 0, jLen = Math.min(reParams.length - 1, binds.length); j < jLen; j++) {
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

        if(!evName || !callEvent(evName, msg[msgType]) || !callEvent("*", msg[msgType])) {
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
        let result = Object.create(objBot.ctx);

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

    let t,
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

            break;
    }

    if(!t) {
        t = text.split(gReSplitCmd, 2);

        cmd = t[0];
        cmdText = t[1];

        if(!cmd || cmd[0] !== "/" || cmd === "/")
            return null;
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
    let t;

    if(
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
        hasOwnProperty(m, t = "group_chat_created")
    ) return t;
}

//---------------------------]>

function createReadStreamByUrl(url, callback) {
    const urlObj = rUrl.parse(url);

    if(!urlObj.protocol || !(/^http/).test(urlObj.protocol)) {
        callback(new Error("Use the links only with HTTP/HTTPS protocol"));
        return;
    }

    const isHTTPS = urlObj.protocol === "https:";
    const options = {
        "host": urlObj.hostname,
        "port": urlObj.port,
        "path": urlObj.path,

        "headers": {
            "User-Agent":   "TgBotApic",
            "Referer":      url
        }
    };

    //-----------]>

    const request = (isHTTPS ? rHttps : rHttp).get(options);

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
    let result;

    const ctx   = Object.create(bot),
          ev    = new rEvents();

    ev.setMaxListeners(100);

    //--------------]>

    result = {
        "bot": bot,
        "ctx": ctx,

        "plugin": [],

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
        let d = this.data;
        this.data = {};

        return bot.send(this.cid, d, callback);
    }

    function ctxForward(callback) {
        let data = {
            "chat_id":      this.to,
            "from_chat_id": this.from,
            "message_id":   this.mid
        };

        return arguments.length < 2 ? bot.api.forwardMessage(data) : bot.api.forwardMessage(data, callback);
    }

    //-----)>

    function srvUse(f) {
        result.plugin.push(f);
        return this;
    }

    function srvEvOn(rule, params, func) {
        if(typeof(params) === "function") {
            func = params;
            params = undefined;
        }

        //------]>

        if(typeof(rule) === "string") {
            let t = rule.split(/\s+/);

            if(t.length > 1)
                rule = t;
        }

        //---)>

        if(Array.isArray(rule)) {
            rule.forEach(function(e) {
                srvEvOn(e, params, func);
            });

            return this;
        }

        //------]>

        let fltEv   = result.filters.ev,
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

        return this;
    }

    function srvEvOff(rule, func) {
        if(Array.isArray(rule)) {
            rule.forEach(function(e) {
                srvEvOff(e, func);
            });

            return this;
        }

        //------]>

        let filters = result.filters;

        let fltEv   = filters.ev,
            fltRe   = filters.regexp;

        //------]>

        if(arguments.length && !fltEv.listenerCount(rule))
            return this;

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

            return this;
        }

        //------]>

        switch(typeof(rule)) {
            case "string":
                fltEv.removeListener(rule, func);
                break;

            case "object":
                if(rule instanceof RegExp) {
                    let id = getIdFltRegExp(rule);

                    if(id >= 0) {
                        fltEv.removeListener(rule, func);

                        if(!fltEv.listenerCount(rule))
                            removeFltRegExp(id);
                    }
                }

                break;
        }

        //------]>

        return this;

        //------]>

        function getIdFltRegExp(obj) {
            for(let i = 0, len = fltRe.length; i < len; i++)
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

        return this;
    }

    function srvAnalytics(apiKey, appName) {
        let rBotan = require("botanio");
        rBotan = rBotan(apiKey);

        result.anTrack = function(data) {
            return rBotan.track(data, appName || "Telegram Bot");
        };

        return this;
    }
}

//-------------[HELPERS]--------------}>

function compileKeyboard(input) {
    let result,
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

    for(let name in input.bin) {
        if(!hasOwnProperty(input.bin, name))
            continue;

        let kb = input.bin[name];

        name = name[0].toUpperCase() + name.substr(1);

        map["v" + name] = kb.map(function(x) { return [x]; });
        map["h" + name] = [kb];
    }

    for(let name in map) {
        if(!hasOwnProperty(map, name))
            continue;

        let kb = map[name];

        result[name] = {"keyboard": kb, "resize_keyboard": true};
        result[name + "Once"] = {"keyboard": kb, "resize_keyboard": true, "one_time_keyboard": true};
    }

    for(let name in input.norm) {
        if(!hasOwnProperty(input.norm, name))
            continue;

        let kb = input.norm[name];

        result[name] = {"keyboard": kb};
        result[name + "Once"] = {"keyboard": kb, "one_time_keyboard": true};
    }

    for(let name in input.ignore) {
        if(!hasOwnProperty(input.ignore, name))
            continue;

        let kb = input.ignore[name];
        result[name] = kb;
    }

    //----------]>

    return result;
}

//----------]>

function tgApiRequest(token, method, callback) {
    if(!method)
        throw new Error("request: `method` was not specified");

    gReqOptions.path = "/bot" + token + "/" + method;

    //--------------]>

    const req = rHttps.request(gReqOptions, cbRequest);

    if(typeof(callback) === "function") {
        req.on("error", callback);
    }

    //--------------]>

    return req;

    //--------------]>

    function cbRequest(response) {
        let firstChunk, chunks;

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

function getNameByMime(contentType) {
    let result;

    if(contentType && typeof(contentType) === "string") {
        switch(contentType) {
            case "audio/mpeg":
            case "audio/MPA":
            case "audio/mpa-robust":
                result = "audio.mp3";
                break;

            default:
                result = contentType.replace("/", ".");
        }
    }

    return result || "";
}

//----------]>

function genErrorByTgResponse(data) {
    if(data && !data.ok) {
        let error = new Error(data.description);
        error.code = data.error_code;

        return error;
    }
}

//----------]>

function hasOwnProperty(obj, prop) {
    return Object.prototype.hasOwnProperty.call(obj, prop);
}

function forEachAsync(data, iter, cbEnd) {
    let i   = 0,
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
