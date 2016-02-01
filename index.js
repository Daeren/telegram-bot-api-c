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

const rTgApi            = require("./src/api");
const rSendApiMethods   = require("./src/send/methods");

const rParseCmd         = require("./src/parseCmd"),
      rKeyboard         = require("./src/keyboard"),

      rServer           = require("./src/server");

//-----------------------------------------------------

const gTgHostFile     = "api.telegram.org",
      gTgHostWebhook  = "api.telegram.org";

const gCRLF           = "\r\n";

const gPipeOptions    = {"end": false};

const gReIsFilePath   = /[\\\/\.]/;

//-----------------------------]>

main.keyboard = rKeyboard;
main.parseCmd = rParseCmd;

//-----------------------------------------------------

module.exports = main;

if(!module.parent) {
    require("./src/cli");
}

//-----------------------------------------------------

function main(token) {
    /*jshint validthis:true */

    let gBoundaryKey, gBoundaryDiv, gBoundaryEnd,

        gBoundaryUDate,
        gBoundaryUIntr  = 1000 * 60 * 5;

    //---------)>

    updateBoundary();

    //---------)>

    function CMain() {
        this.api        = rTgApi.genMethodsForMe(this);

        this.keyboard   = rKeyboard;
        this.parseCmd   = rParseCmd;

        this.mdPromise  = Promise;

        this.kvCfgStore = Object.create(null);
    }

    CMain.prototype = {
        "enable":        function(key) { this.kvCfgStore[key] = true; return this; },
        "disable":       function(key) { delete this.kvCfgStore[key]; return this; },
        "enabled":       function(key) { return this.kvCfgStore[key] === true; },
        "disabled":      function(key) { return this.kvCfgStore[key] !== true; },

        "token":        function(t) {
            if(!arguments.length) {
                return token;
            }

            token = t;

            return this;
        },

        "engine":       function(t) { this.mdEngine = t; return this; },
        "promise":      function(t) { this.mdPromise = t; return this; },

        "call":         callAPI,
        "callJson":     callAPIJson,

        "render":       mthCMainRender,
        "send":         mthCMainSend,
        "broadcast":    mthCMainBroadcast,
        "download":     mthCMainDownload,

        "polling":      function(params, callback) { return rServer.polling(this, params, callback); },
        "http":         function(params, callback) { return rServer.http(this, params, callback); },
        "virtual":      function(callback) { return rServer.virtual(this, callback); }
    };

    //-------------------------]>

    return new CMain();

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

    function getReadStreamByUrl(url, type, method, data, callback) {
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
            createReadStreamByUrl(url, onResponse);
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

            callAPI(method, result, callback);
        }
    }

    //-----------[L1]----------}>

    function callAPI(method, data, callback) {
        if(!token || typeof(token) !== "string") {
            throw new Error("callAPI | Forbidden. Check the Access Token: " + token + " [" + method + "]");
        }

        //-------------------------]>

        let t, result;

        let req,
            body, bodyBegin, bodyEnd,
            file, fileName, fileId;

        //---------]>

        if(arguments.length === 2) {
            if(typeof(data) === "function") {
                callback = data;
                data = null;
            }
        }

        if(Date.now() - gBoundaryUDate >= gBoundaryUIntr) {
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

        req = rTgApi.request(token, method, function(error, body, response) {
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
        if(typeof(data) === "function") {
            callback = data;
            data = null;
        }

        //-----------]>

        return callAPI(method, data, cbCallAPI);

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

    //-----------[L2]----------}>

    function mthCMainRender(template, data) {
        if(!template) {
            return "";
        }

        if(!data) {
            return template;
        }

        if(this.mdEngine) {
            return this.mdEngine.render(template, data);
        }

        //-------------]>

        if(Array.isArray(data)) {
            data.forEach(defRender);
        }
        else if(typeof(data) === "object") {
            for(let name in data) {
                if(hasOwnProperty.call(data, name)) {
                    defRender(data[name], name);
                }
            }
        }

        //-------------]>

        return template;

        //-------------]>

        function defRender(e, i) {
            template = template.replace("{" + i + "}", e);
        }
    }

    function mthCMainSend(id, data, callback) {
        const self = this;

        //-----]>

        if(typeof(callback) === "undefined") {
            return new this.mdPromise(cbPromise);
        }

        cbPromise();

        //-------------------------]>

        function cbPromise(resolve, reject) {
            let cmdName, cmdData;

            callback = callback || function(error, results) {
                if(error) {
                    reject(error);
                }
                else {
                    resolve(results);
                }
            };

            //--------]>

            if(Array.isArray(data)) {
                const results = {};

                forEachAsync(data, function(next, d) {
                    call(d, function(error, body) {
                        const stack = results[cmdName] = results[cmdName] || [];
                        stack.push(body);

                        next(error, results);
                    });

                }, callback);
            }
            else {
                call(data, callback);
            }

            //--------]>

            function call(d, cb) {
                cmdName = getName(d);

                if(!cmdName) {
                    throw new Error("Send: element not found!");
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

                    if(hasOwnProperty.call(d, type)) {
                        return type;
                    }
                }
            }
        }
    }

    function mthCMainBroadcast(ids, data, callback) {
        const self = this;

        let result  = {},
            isEnd   = false,

            countUsersPerSec, dTime, startTime;

        //-----]>

        result.stop = function() {
            isEnd = true;
        };

        callback = callback || function() {};

        //--------]>

        init();

        forEachAsync(ids, function(next, id, index) {
            process.nextTick(send);

            //--------------]>

            function send() {
                if(isEnd) {
                    callback(null, index);
                }
                else {
                    self.send(id, data, onEnd);
                }
            }

            function onEnd(error) {
                if(error) {
                    if(error.code === 429) {
                        setTimeout(send, 1000 * 45);
                    }
                    else {
                        next(error, index);
                    }

                    return;
                }

                //---------]>

                countUsersPerSec--;
                dTime = startTime - Date.now();

                //---------]>

                if(!countUsersPerSec && dTime < 1000) {
                    dTime = 1000 - dTime;

                    if(dTime <= 20) {
                        init();
                        next(null, index);
                    }
                    else {
                        setTimeout(function() {
                            init();
                            next(null, index);
                        }, dTime);
                    }
                }
                else if(dTime > 1000) {
                    init();
                    next(null, index);
                }
                else {
                    next(null, index);
                }
            }
        }, callback);

        //-------------------------]>

        return result;

        //-------------------------]>

        function init() {
            countUsersPerSec = 30;
            startTime = Date.now();
        }
    }

    function mthCMainDownload(fid, dir, name, callback) {
        const self = this;

        //-----]>

        if(typeof(dir) === "function") {
            callback = dir;
            dir = undefined;
        }
        else if(typeof(name) === "function") {
            callback = name;
            name = undefined;
        }

        if(typeof(callback) === "undefined") {
            return new this.mdPromise(cbPromise);
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

            //--------]>

            self.api.getFile({"file_id": fid}, function(error, data) {
                if(error) {
                    callback(error, data);
                    return;
                }

                //--------]>

                const fileId      = data.file_id,
                      fileSize    = data.file_size,
                      filePath    = data.file_path;

                const url         = "https://" + gTgHostFile + "/file/bot" + token +"/" + filePath;

                let fileName      = filePath.split("/").pop();

                //--------]>

                if(name) {
                    fileName = fileName.match(/\.(.+)$/);
                    fileName = fileName && fileName[0] || "";
                } else {
                    name = Date.now();
                }

                //--------]>

                if(typeof(dir) === "undefined" || typeof(name) === "undefined") {
                    createReadStreamByUrl(url, function(error, response) {
                        if(error) {
                            callback(error);
                        }
                        else {
                            callback(null, {
                                "id":       fileId,
                                "size":     fileSize,
                                "file":     fileName,
                                "stream":   response
                            });
                        }
                    });

                    return;
                }

                //--------]>

                dir += "/" + name + fileName;

                //----[Write]----}>

                const file = rFs.createWriteStream(rPath.normalize(dir));

                //--------]>

                file
                    .on("error", callback)
                    .on("open", function() {
                        createReadStreamByUrl(url, function(error, response) {
                            if(error) {
                                callback(error);
                                return;
                            }

                            response.pipe(file);
                        });
                    })
                    .on("finish", function() {
                        callback(null, {
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

    //-------]>

    const isHTTPS = urlObj.protocol === "https:";
    const options = {
        "host": urlObj.hostname,
        "port": urlObj.port,
        "path": urlObj.path,

        "headers": {
            "User-Agent":   "TgBApic",
            "Referer":      url
        }
    };

    //-----------]>

    (isHTTPS ? rHttps : rHttp)
        .get(options)
        .on("error", callback)
        .on("response", function(res) {
            callback(null, res);
        });
}

function prepareDataForSendApi(id, cmdName, cmdData, data) {
    const result = Object.create(data);

    //----------]>

    result.chat_id = id;

    //----------]>

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
                    }
                    else if(cmdData) {
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

        default:
            break;
    }

    //----------]>

    return result;
}

//-------------[HELPERS]--------------}>

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
                cbEnd(error, result);
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