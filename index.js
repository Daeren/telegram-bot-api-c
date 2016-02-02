//-----------------------------------------------------
//
// Author: Daeren
// Site: 666.io
//
//-----------------------------------------------------

"use strict";

//-----------------------------------------------------

const rFs               = require("fs"),
      rStream           = require("stream"),
      rPath             = require("path");

const rTgApi            = require("./src/api");

const rSendMethods      = require("./src/sendMethods");

const rUtil             = require("./src/util"),

      rParseCmd         = require("./src/parseCmd"),
      rKeyboard         = require("./src/keyboard"),

      rServer           = require("./src/server");

//-----------------------------------------------------

const gTgHostFile     = "api.telegram.org";

//-----------------------------]>

main.keyboard = rKeyboard;
main.parseCmd = rParseCmd;

main.call = rTgApi.call;
main.callJson = rTgApi.callJson;

//-----------------------------------------------------

module.exports = main;

if(!module.parent) {
    require("./src/cli");
}

//-----------------------------------------------------

function main(token) {
    /*jshint validthis:true */

    function CMain() {
        this.mdPromise  = Promise;

        this.kvCfgStore = Object.create(null);

        this.keyboard   = rKeyboard;
        this.parseCmd   = rParseCmd;

        this.api        = rTgApi.genMethodsForMe(this);
    }

    CMain.prototype = {
        "enable":       function(key) { this.kvCfgStore[key] = true; return this; },
        "disable":      function(key) { delete this.kvCfgStore[key]; return this; },
        "enabled":      function(key) { return this.kvCfgStore[key] === true; },
        "disabled":     function(key) { return this.kvCfgStore[key] !== true; },

        "token":        function(t) {
            if(!arguments.length) {
                return token;
            }

            token = t;

            return this;
        },

        "engine":       function(t) { this.mdEngine = t; return this; },
        "promise":      function(t) { this.mdPromise = t; return this; },

        "call":         function(method, data, callback) { rTgApi.call(token, method, data, callback); },
        "callJson":     function(method, data, callback) { rTgApi.callJson(token, method, data, callback); },

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

    //-----------[Methods]----------}>

    function mthCMainRender(template, data) {
        if(!template) {
            return "";
        }

        if(!data) {
            return template;
        }

        //-------------]>

        const mdEngine = this.mdEngine;

        if(mdEngine) {
            return mdEngine.render(template, data);
        }

        //-------------]>

        if(Array.isArray(data)) {
            data.forEach(defaultRender);
        }
        else if(typeof(data) === "object") {
            for(let name in data) {
                if(hasOwnProperty.call(data, name)) {
                    defaultRender(data[name], name);
                }
            }
        }

        //-------------]>

        return template;

        //-------------]>

        function defaultRender(e, i) {
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

                self.api[rSendMethods.map[cmdName]](cmdData, cb);
            }

            function getName(d) {
                let type,
                    len = rSendMethods.length;

                while(len--) {
                    type = rSendMethods.keys[len];

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

            numUsersPerSec, dTime, startTime;

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

                numUsersPerSec--;
                dTime = startTime - Date.now();

                //---------]>

                if(!numUsersPerSec && dTime < 1000) {
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
            numUsersPerSec = 30;
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
                    rUtil.createReadStreamByUrl(url, function(error, response) {
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
                        rUtil.createReadStreamByUrl(url, function(error, response) {
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