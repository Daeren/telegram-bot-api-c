//-----------------------------------------------------
//
// Author: Daeren
// Site: 666.io
//
//-----------------------------------------------------

"use strict";

//-----------------------------------------------------

const rHttp             = require("http"),
      rHttps            = require("https"),
      rUrl              = require("url"),
      rFs               = require("fs"),
      rStream           = require("stream"),
      rPath             = require("path");

const rApiMethods       = require("./src/api/methods");
const rSendApiMethods   = require("./src/send/methods");

const rParseCmd         = require("./src/parseCmd"),
      rKeyboard         = require("./src/keyboard");

const rServer           = require("./src/server");

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

const gReIsFilePath   = /[\\\/\.]/;

//-----------------------------]>

main.keyboard = rKeyboard;
main.parseCmd = rParseCmd;

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

    function CMain() {
        this.api        = genApiMethods(this);
        this.keyboard   = rKeyboard;

        this.mdPromise  = Promise;
    }

    CMain.prototype = {
        "token":        function(t) { token = t; return this; },
        "setToken":     function(t) { token = t; return this; },

        "engine":       function(t) { this.mdEngine = t; return this; },
        "promise":      function(t) { this.mdPromise = t; return this; },

        "call":         callAPI,
        "callJson":     callAPIJson,

        "send":         mthCMainSend,
        "download":     mthCMainDownload,

        "server":       function(params, callback) { return rServer.http(this, params, callback); },
        "polling":      function(params, callback) { return rServer.polling(this, params, callback); },

        "parseCmd":     rParseCmd
    };

    //-------------------------]>

    return new CMain();

    //-------------------------]>

    function genApiMethods(bot) {
        let result = {};

        rApiMethods.forEach(add);

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
                    cbPromise(); else defer = new bot.mdPromise(cbPromise);

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

                const statusCode = response.statusCode;

                if(statusCode < 200 || statusCode > 399) {
                    response = undefined;
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

                onEnd();

                //--------------]>

                function onEnd() {
                    let result = Object.create(data);
                    result[type] = response;

                    //-----[API]-----}>

                    callAPI(method, result, callback);
                }
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

        //-------[File: buffer]-------}>

        if(Buffer.isBuffer(file)) {
            req.write(file);
            req.end(bodyEnd);

            return;
        }

        //-------[File: stream]-------}>

        if(!file) {
            req.end(bodyEnd);
            return;
        }

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
                return false;
            }

            if(typeof(file) === "string") {
                if(getReadStreamByUrl(file, type, method, data, callback)) { // <-- Delegate task
                    return true;
                }

                fileName = data.filename || file;

                if(!gReIsFilePath.test(fileName)) {
                    fileId = fileName;
                }
            }
            else if(typeof(file) === "object" && file.headers) { // <-- LoadByUrl
                fileName = data.filename || file.req.path || getNameByMime(file.headers["content-type"]);
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

        if(typeof(callback) !== "undefined") {
            cbPromise();
        }
        else {
            defer = new this.mdPromise(cbPromise);
        }

        //-------------------------]>

        return defer;

        //-------------------------]>

        function cbPromise(resolve, reject) {
            let cmdName, cmdData;

            const cbEnd = callback ? callback : function(error, results) {
                if(error) {
                    reject(error);
                }
                else {
                    resolve(results);
                }
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
            }
            else {
                call(data, cbEnd);
            }

            //--------]>

            function call(d, cb) {
                cmdName = getName(d);

                if(!cmdName) {
                    throw new Error("Command not found!");
                }

                cmdData = d[cmdName];
                cmdData = prepareDataForSendApi(id, cmdName, cmdData, d);

                self.api[rSendApiMethods.map[cmdName]](cmdData, cb);
            }

            function getName(d) {
                let type,
                    len = rSendApiMethods.length;

                while(len--) {
                    type = rSendApiMethods.keys[len];

                    if(hasOwnProperty(d, type)) {
                        return type;
                    }
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
            cbPromise(); else defer = new this.mdPromise(cbPromise);

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
    let result = Object.create(data);
    result.chat_id = id;

    switch(typeof(cmdData)) {
        case "string":
            switch(cmdName) {
                case "location":
                    cmdData = cmdData.split(/\s+/);

                    result.latitude = cmdData[0];
                    result.longitude = cmdData[1];

                    break;

                case "chatAction":
                    result.action = cmdData;

                    break;

                default:
                    result[cmdName] = cmdData;

                    break;
            }

            break;

        case "object":
            switch(cmdName) {
                case "location":
                    if(Array.isArray(cmdData)) {
                        result.latitude = cmdData[0];
                        result.longitude = cmdData[1];
                    } else if(cmdData) {
                        result.latitude = cmdData.latitude;
                        result.longitude = cmdData.longitude;
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
                                result[cmdName] = cmdData;

                                break;
                        }
                    }
            }

            break;
    }

    return result;
}

//-------------[HELPERS]--------------}>

function tgApiRequest(token, method, callback) {
    if(!method) {
        throw new Error("request: `method` was not specified");
    }

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

    if(len) {
        run();
    }
    else {
        if(cbEnd) {
            cbEnd();
        }
    }

    //---------]>

    function run() {
        iter(cbNext, data[i], i);
    }

    function cbNext(error, result) {
        if(error) {
            if(cbEnd) {
                cbEnd(error);
            }

            return;
        }

        i++;

        if(i >= len) {
            if(cbEnd) {
                cbEnd(error, result);
            }
        } else {
            run();
        }
    }
}
