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

const rTgApi            = require("./src/api");

const rUtil             = require("./src/util"),
      rErrors           = require("./src/errors"),

      rParseCmd         = require("./src/parseCmd"),
      rKeyboard         = require("./src/keyboard"),

      rServer           = require("./src/server");

//-----------------------------------------------------

const gTgHostFile = "api.telegram.org";

//-----------------------------]>

main.keyboard   = rKeyboard;
main.parseCmd   = rParseCmd;

main.call       = rTgApi.callAPI;
main.callJson   = rTgApi.callAPIJson;

//-----------------------------------------------------

module.exports = rErrors(main);

if(!module.parent) {
    require("./src/cli");
}

//-----------------------------------------------------

function main(token) {
    /*jshint validthis:true */

    function CMain() {
        this.mdPromise  = Promise;
        this.kvCfgStore = new Map();

        this.keyboard   = rKeyboard;
        this.parseCmd   = rParseCmd;

        this.api        = rTgApi.genMethodsFor(this);
    }

    CMain.prototype = {
        enable(key)                         { this.kvCfgStore.set(key, true); return this; },
        disable(key)                        { this.kvCfgStore.delete(key); return this; },
        enabled(key)                        { return this.kvCfgStore.has(key); },
        disabled(key)                       { return !this.enabled(key); },

        engine(t)                           { this.mdEngine = t; return this; },
        promise(t)                          { this.mdPromise = t; return this; },

        call(method, data, callback)        { rTgApi.callAPI(token, method, data, callback, this._optProxy, this.enabled("tgUrlUpload")); },
        callJson(method, data, callback)    { rTgApi.callAPIJson(token, method, data, callback, this._optProxy, this.enabled("tgUrlUpload")); },

        polling(params, callback)           { return rServer.polling(this, params, callback); },
        http(params, callback)              { return rServer.http(this, params, callback); },
        virtual(callback)                   { return rServer.virtual(this, callback); },

        "render":       mthCMainRender,
        "download":     mthCMainDownload,

        proxy(t) {
            if(!t) {
                this._optProxy = null;
                return this;
            }

            if(typeof(t) === "string") {
                t = t.split(":");
            }

            this._optProxy = this._optProxy || {};
            this._optProxy.host = t.host || t[0];
            this._optProxy.port = t.port || t[1];

            return this;
        },

        token(t) {
            if(!arguments.length) {
                return token;
            }

            token = t;

            return this;
        }
    };

    //-------------------------]>

    return rErrors(new CMain());

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

        //-------------------------]>

        if(typeof(callback) === "undefined") {
            return new this.mdPromise(cbPromise);
        }

        cbPromise();

        //-------------------------]>

        function cbPromise(resolve, reject) {
            callback = callback || ((error, result) => error ? reject(error) : resolve(result));

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