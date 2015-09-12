//-----------------------------------------------------
//
// Author: Daeren Torn
// Site: 666.io
//
//-----------------------------------------------------

"use strict";

//-----------------------------------------------------

var rHttps          = require("https"),
    rFs             = require("fs"),
    rStream         = require("stream");

var gCRLF           = "\r\n";

var gPipeOptions    = {"end": false};
var gReqOptions     = {
    "host":         "api.telegram.org",
    "method":       "POST"
};

var gRePhotoExt     = /\.(jp[e]?g|[gt]if|png|bmp)$/i,
    gReAudioExt     = /\.(mp3)$/i,
    gReDocumentExt  = /[\\\/\.]/,
    gReStickerExt   = /\.(jp[e]?g|[gt]if|png|bmp|webp)$/i,
    gReVideoExt     = /\.(mp4)$/i,
    gReVoiceExt     = /\.(ogg)$/i;

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

var CBot = function(token) {
    this.call = callAPI;
    this.callJson = callAPIJson;

    this.send = send;
    this.i = getMe;

    this.createServer = createServer;

    this.setToken = setToken;

    //--------------------]>

    var self = this;

    var gBoundaryKey, gBoundaryDiv, gBoundaryEnd,

        gBoundaryUDate,
        gBoundaryUIntr  = 1000 * 60 * 5;

    //---------)>

    updateBoundary();

    //--------------------]>

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
            var error, chunks;

            if(response.statusCode === 403)
                error = new Error("Check the Access Token: " + token);

            if(typeof(callback) !== "function") {
                if(error)
                    throw error;

                return;
            }

            //---------]>

            chunks = [];

            //---------]>

            response.on("data", function(chunk) {
                chunks.push(chunk);
            });

            response.on("end", function() {
                var result = Buffer.concat(chunks);

                response.body = result;

                callback(error || null, result, response);
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

    //-----------)>

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
                var t;

                if(t = data.offset)
                    body += genBodyField("text", "offset", t);

                if(t = data.limit)
                    body += genBodyField("text", "limit", t);

                if(t = data.timeout)
                    body += genBodyField("text", "timeout", t);

                break;

            case "setWebhook":
                var t, result;

                file = data.certificate;

                result = genBodyField("text", "url", data.url);

                if(t = data.certificate)
                    result += genBodyField("text", "certificate", t);

                if(file) {
                    bodyBegin = result;
                    bodyEnd = "";
                } else {
                    body = result;
                }

                break;

            default:
                switch(method) {
                    case "getMe":
                        request(method, callback).end();
                        return;
                }

                throw new Error("API method not found!")
        }

        //-------------------------]>

        if(body)
            body += genBodyField("end"); else bodyEnd += genBodyField("end");

        //-------------------------]>

        req = request(method, callback);
        req.setHeader("Content-Type", "multipart/form-data; boundary=\"" + gBoundaryKey + "\"");

        if(body) {
            req.end(body);
        } else {
            if(typeof(file) === "string")
                file = rFs.createReadStream(file);
            else {
                if(file.closed) {
                    req.write(bodyBegin);
                    req.end(bodyEnd);

                    return;
                }
            }

            file.pipe(req, gPipeOptions);
            file
                .on("error", function(error) {
                    req.write(bodyBegin);
                    req.end(bodyEnd);
                })
                .on("open", function() {
                    req.write(bodyBegin);
                })
                .on("end", function() {
                    req.end(bodyEnd);
                });
        }
    }

    function callAPIJson(method, data, callback) {
        return callAPI(method, data, function(error, result, response) {
            if(error)
                return callback(error);

            if(result && typeof(result) === "string") {
                try {
                    result = JSON.parse(result);
                } catch(e) {
                    error = e;
                    result = null;
                }
            } else
                result = {};

            callback(error, result, response)
        });
    }

    //-----------)>

    function send(id, data, callback) {
        var def;

        if(typeof(callback) !== "undefined")
            cbPromise(function(r) { callback(null, r); }, function(e) { callback(e); });
        else
            def = new Promise(cbPromise);

        //-------------------------]>

        return def;

        //-------------------------]>

        function cbPromise(resolve, reject) {
            var cmdData, cmdName;

            if(Array.isArray(data)) {
                var results = {};

                forEachAsync(data, function(next, d) {
                    call(d, function(error, body){
                        var stack = results[cmdName] = results[cmdName] || [];
                        stack.push(body);

                        next(error);
                    });
                }, function(error) {
                    if(error)
                        return reject(error);

                    resolve(results);
                });
            } else {
                call(data, function(error, body){
                    if(error)
                        return reject(error);

                    resolve(body);
                });
            }

            function call(d, cb) {
                cmdName = getName(d);

                if(!cmdName)
                    throw new Error("Command not found!");

                cmdData = d[cmdName];
                cmdData = prepareDataForSendApi(id, cmdName, cmdData, d);

                callAPI(gMethodsMap[cmdName], cmdData, cb);
            }

            function getName(d) {
                var type, len = gMMTypesLen;

                while(len--) {
                    type = gMMTypesKeys[len];

                    if(d.hasOwnProperty(type))
                        return type;
                }
            }
        }
    }

    //----)>

    function getMe(callback) {
        var def;

        if(callback)
            callAPI("getMe", callback); else def = new Promise(cbPromise);

        return def;

        //-------------------------]>

        function cbPromise(resolve, reject) {
            callAPI("getMe", function(error, body) {
                if(error)
                    reject(error); else resolve(body);
            });
        }
    }

    //-----------)>

    function setToken(t) {
        token = t;
        return self;
    }
};

//-----------------------------------------------------

module.exports = CBot;

//-----------------------------------------------------

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

function createServer(params, callback) {
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

    //----------)>

    var srv,
        srvCommands = {},

        options = {
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

    srv = rHttps.createServer(options, cbServer).listen(params.port || 88, params.host, cbListen);

    //---)>

    srv.command = function command(cmd, cb) {
        srvCommands[cmd] = cb;
    };

    //-----------------]>

    return srv;

    //-----------------]>

    function cbServer(req, res) {
        if(req.method == "POST") {
            var chunks = [];

            req.on("data", function(chunk) {
                chunks.push(chunk);
            });

            req.on("end", function() {
                response();

                //------------]>

                var cmd,
                    result = Buffer.concat(chunks).toString();

                if(result) {
                    try {
                        result = JSON.parse(result);
                    } catch(e) {
                        result = null;
                    }
                }

                if(!result)
                    return;

                if(cmd = parseCmd(result.message.text))
                    cmd.func(result, cmd.params, req); else callback(result, req);
            });
        } else
            response();


        function response(code) {
            res.writeHead(code || 200, {"Content-Type": "text/plain"});
            res.end("");
        }
    }

    function cbListen() {
        var host = srv.address().address;
        var port = srv.address().port;

        console.log("> Server run: [%s:%s]", host, port);
        console.log("> Date: %s", getTime());
        console.log("\n-----------------------------------------\n");

        process.on("SIGINT", function() {
            console.log("> Date: %s", getTime());

            process.exit();
        });

        function getTime() {
            return new Date().toISOString().replace(/T/, " ").replace(/\..+/, "");
        }
    }

    //-----------------]>

    function parseCmd(text) {
        if(!text || text[0] !== "/")
            return null;

        var t       = text.split(/\s+([\s\S]+)?/, 2);

        var name    = t[0].substr(1),
            cmdFunc = srvCommands[name];

        if(!cmdFunc)
            return null;

        return {
            "func":     cmdFunc,

            "params":   {
                "cmd":  t[0],
                "text": t[1] || "",
                "name": name
            }
        };
    }
}