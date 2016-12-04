//-----------------------------------------------------
//
// Author: Daeren
// Site: 666.io
//
//-----------------------------------------------------

/*jshint expr: true*/
/*global describe, it*/

"use strict";

//-----------------------------------------------------

const rChai     = require("chai");

const expect    = rChai.expect;

const rBot      = require("./../index"),
      rFs       = require("fs");

const rAPIProto = require("./../src/api/proto");

//-----------------------------------------------------

const token     = process.env.TELEGRAM_BOT_TOKEN,
      chatId    = process.env.TELEGRAM_CHAT_ID,
      msgId     = process.env.TELEGRAM_MSG_ID;

const objBot    = rBot(token);

const api       = objBot.api,
      keyboard  = objBot.keyboard,

      parseCmd  = objBot.parseCmd;

let midEditText, midEditCaption;

//-----------------------------------------------------

expect(token).to.exist;
expect(chatId).to.exist;
expect(msgId).to.exist;

//----------------------------------]>

describe("Module: bot", function() {

    it("Require", function() {
        expect(rBot).to.be.a("function");
    });

    describe("Method", function() {

        it("keyboard", function() {
            expect(rBot).to.have.property("keyboard").that.is.a("function");
            expect(rBot.keyboard).to.have.property("inline").that.is.a("function");
        });

        it("parseCmd", function() {
            expect(rBot).to.have.property("parseCmd").that.is.a("function");
        });

        it("call", function() {
            expect(rBot).to.have.property("call").that.is.a("function");
        });

        it("callJson", function() {
            expect(rBot).to.have.property("callJson").that.is.a("function");
        });

    });

    it("call(getMe) | callback", function(done) {
        rBot
            .call(token, "getMe", function(error, result, response) {
                checkWithoutError(error);

                expect(result).to.be.an.instanceof(Buffer);
                expect(response).to.be.an("object").and.not.equal(null);

                done();
            });
    });

    it("callJson(getMe) | callback", function(done) {
        rBot
            .callJson(token, "getMe", function(error, result, response) {
                checkWithoutError(error);

                expect(result).to.be.an("object").and.not.equal(null);
                expect(response).to.be.an("object").and.not.equal(null);

                expect(result).to.have.property("ok").to.equal(true);
                expect(result).to.have.property("result").to.be.an("object").and.not.equal(null);

                done();
            });
    });

});

//-----------------]>

describe("Instance: bot", function() {
    this.timeout(1000 * 60);

    //-----------------]>

    it("Instance", function() {
        expect(objBot).to.be.an("object").and.not.equal(null);
    });

    //-----------------]>

    describe("Properties", function() {

        const botMethods = [
            "enable", "disable", "enabled", "disabled",

            "engine", "promise", "token",

            "call", "callJson",
            "render", "download",

            "polling", "http", "virtual",

            "keyboard", "parseCmd"
        ];

        //-----------------]>

        it("api", function() {
            expect(api).to.be.an("object").and.not.equal(null);

            for(let method of rAPIProto.methods) {
                expect(api).to.have.property(method);
            }
        });

        for(let method of botMethods) {
            it(method, function() {
                expect(objBot).to.have.property(method).that.is.a("function");
            });
        }

    });

    //-----------------]>

    describe("Methods", function() {

        it("enable/enabled/disable/disabled", function() {
            const key = "test";

            //--------]>

            expect(objBot.disabled(key)).to.equal(true);
            expect(objBot.enabled(key)).to.equal(false);

            objBot.enable(key);

            expect(objBot.disabled(key)).to.equal(false);
            expect(objBot.enabled(key)).to.equal(true);

            objBot.disable(key);

            expect(objBot.disabled(key)).to.equal(true);
            expect(objBot.enabled(key)).to.equal(false);
        });

        it("token", function() {
            const key       = "test",
                  shToken   = token;

            //--------]>

            expect(objBot.token()).to.equal(token);

            objBot.token(key);

            expect(objBot.token()).to.equal(key);

            objBot.token(shToken);

            expect(objBot.token()).to.equal(token);
        });

        it("render", function() {
            let r,

                templateObject  = "{name} {x}",
                templateArray   = "{0} {1}",

                equal           = "MiElPotato 13";

            const inputObject   = {"name": "MiElPotato", "x": 13},
                  inputArray    = ["MiElPotato", 13];

            //--------]>

            r = objBot.render(templateObject, inputObject);
            expect(r).to.equal(equal);

            r = objBot.render(templateArray, inputArray);
            expect(r).to.equal(equal);

            //--------]>

            r = objBot.render(templateObject);
            expect(r).to.equal(templateObject);

            r = objBot.render(templateArray);
            expect(r).to.equal(templateArray);

            //--------]>

            r = objBot.render();
            expect(r).to.equal("");

            r = objBot.render();
            expect(r).to.equal("");
        });

        //------)>

        it("keyboard", function() {
            let buttons;

            //-----]>

            expect(keyboard).to.be.a("function");

            //-----]>

            buttons = keyboard.hOx;

            expect(buttons).to.be.a("function");

            expect(buttons()).to.have.property("keyboard").that.is.an("array");
            expect(buttons(true)).to.have.property("one_time_keyboard").that.is.equal(true);
            expect(buttons(false, true)).to.have.property("selective").that.is.equal(true);

            //-----]>

            buttons = keyboard("X Y Z");

            expect(buttons).to.be.an("object").and.not.equal(null);

            expect(buttons).to.have.property("keyboard").that.is.an("array");

            //-----]>

            buttons = keyboard([["X"]], "resize once selective");

            expect(buttons).to.be.an("object").and.not.equal(null);

            expect(buttons).to.have.property("keyboard").that.is.an("array");
            expect(buttons).to.have.property("resize_keyboard");
            expect(buttons).to.have.property("one_time_keyboard");
            expect(buttons).to.have.property("selective");

            //-----]>

            buttons = keyboard.hide();
            buttons.selective = true;
            buttons.resize_keyboard = true;

            expect(keyboard.hide()).to.deep.equal(keyboard());
            expect(keyboard()).to.deep.equal(keyboard(false));
            expect(keyboard(false, "selective resize")).to.deep.equal(buttons);

        });

        //------)>


        describe("parseCmd | normal-strict", function() {
            const cmdSelf = "/12345678901234567890123456789012",

                cmdName = "12345678901234567890123456789012",
                cmdText = "[text]";

            let cmdType = "common";
            let normalCmds = [
                "/12345678901234567890123456789012 [text]",
                "/12345678901234567890123456789012@bot [text]",
                "@bot /12345678901234567890123456789012 [text]"
            ];

            //-----]>

            expect(parseCmd).to.be.a("function");

            //-----]>

            for(let cmd of normalCmds) {
                it(cmd, function(cmd, cmdType) {
                    let t = parseCmd(cmd, true);

                    expect(t).to.be.an("object").and.not.equal(null);

                    expect(t).to.have.property("type").that.is.equal(cmdType);
                    expect(t).to.have.property("name").that.is.equal(cmdName);
                    expect(t).to.have.property("text").that.is.equal(cmdText);
                    expect(t).to.have.property("cmd").that.is.equal(cmdSelf);
                }.bind(this, cmd, cmdType));

                cmdType = "private";
            }

            //--------[@]-------}>

            cmdType = "common";
            normalCmds = [
                "/12345678901234567890123456789012 /[text]",
                "/12345678901234567890123456789012@bot /[text]",
                "@bot /12345678901234567890123456789012 /[text]"
            ];

            //-----]>

            for(let cmd of normalCmds) {
                it(cmd, function(cmd, cmdType) {
                    let t = parseCmd(cmd, true);

                    expect(t).to.be.an("object").and.not.equal(null);

                    expect(t).to.have.property("type").that.is.equal(cmdType);
                    expect(t).to.have.property("name").that.is.equal(cmdName);
                    expect(t).to.have.property("text").that.is.equal("/" + cmdText);
                    expect(t).to.have.property("cmd").that.is.equal(cmdSelf);
                }.bind(this, cmd, cmdType));

                cmdType = "private";
            }

            //--------[Empty]-------}>

            cmdType = "common";
            normalCmds = [
                "/ /[text]",

                "/@bot /[text]",
                "@bot / /[text]"
            ];

            //-----]>

            for(let cmd of normalCmds) {
                it(cmd, function(cmdType) {
                    let t = parseCmd(cmd, true);

                    expect(t).to.be.an("object").and.not.equal(null);

                    expect(t).to.have.property("type").that.is.equal(cmdType);
                    expect(t).to.have.property("name").that.is.equal("");
                    expect(t).to.have.property("text").that.is.equal("/" + cmdText);
                    expect(t).to.have.property("cmd").that.is.equal("/");
                }.bind(this, cmdType));

                cmdType = "private";
            }

            //----------)>

            cmdType = "common";
            normalCmds = [
                "/ [text]",

                "/@bot [text]",
                "@bot / [text]"
            ];

            //-----]>

            for(let cmd of normalCmds) {
                it(cmd, function(cmdType) {
                    let t = parseCmd(cmd, true);

                    expect(t).to.be.an("object").and.not.equal(null);

                    expect(t).to.have.property("type").that.is.equal(cmdType);
                    expect(t).to.have.property("name").that.is.equal("");
                    expect(t).to.have.property("text").that.is.equal(cmdText);
                    expect(t).to.have.property("cmd").that.is.equal("/");
                }.bind(this, cmdType));

                cmdType = "private";
            }
        });

        describe("parseCmd | fake-strict", function() {
            const fakeCmds = [
                "/123456789012345678901234567890123 [text]",
                "/123456789012345678901234567890123@bot [text]",
                "@bot /123456789012345678901234567890123 [text]",
                "/123456789012345678901234567890123 /[text]",
                "/123456789012345678901234567890123@bot /[text]",
                "@bot /123456789012345678901234567890123 /[text]"
            ];

            //-----]>

            expect(parseCmd).to.be.a("function");

            //-----]>

            for(let cmd of fakeCmds) {
                it(cmd, function() {
                    expect(parseCmd(cmd, true)).to.be.null;
                });
            }
        });

        describe("parseCmd | normal", function() {
            const cmdSelf = "/start",
                cmdName = "start",
                cmdText = "[text]";

            let cmdType = "common";
            let normalCmds = [
                "/start [text]", "/start@bot [text]", "@bot /start [text]"
            ];

            //-----]>

            expect(parseCmd).to.be.a("function");

            //-----]>

            for(let cmd of normalCmds) {
                it(cmd, function(cmd, cmdType) {
                    let t = parseCmd(cmd);

                    expect(t).to.be.an("object").and.not.equal(null);

                    expect(t).to.have.property("type").that.is.equal(cmdType);
                    expect(t).to.have.property("name").that.is.equal(cmdName);
                    expect(t).to.have.property("text").that.is.equal(cmdText);
                    expect(t).to.have.property("cmd").that.is.equal(cmdSelf);
                }.bind(this, cmd, cmdType));

                cmdType = "private";
            }

            //--------[@]-------}>

            cmdType = "common";
            normalCmds = [
                "/start /[text]", "/start@bot /[text]", "@bot /start /[text]"
            ];

            //-----]>

            for(let cmd of normalCmds) {
                it(cmd, function(cmd, cmdType) {
                    let t = parseCmd(cmd);

                    expect(t).to.be.an("object").and.not.equal(null);

                    expect(t).to.have.property("type").that.is.equal(cmdType);
                    expect(t).to.have.property("name").that.is.equal(cmdName);
                    expect(t).to.have.property("text").that.is.equal("/" + cmdText);
                    expect(t).to.have.property("cmd").that.is.equal(cmdSelf);
                }.bind(this, cmd, cmdType));

                cmdType = "private";
            }
        });

        describe("parseCmd | fake", function() {
            const fakeCmds = [
                "@bot [text]",
                "@ [text]", "@ / [text]", " / [text]"
            ];

            //-----]>

            expect(parseCmd).to.be.a("function");

            //-----]>

            for(let cmd of fakeCmds) {
                it(cmd, function() {
                    expect(parseCmd(cmd)).to.be.null;
                });
            }
        });

        //-----------------]>

        it("call(getMe-2args) | callback", function(done) {
            objBot
                .call("getMe", function(error, result, response) {
                    checkWithoutError(error);

                    expect(result).to.be.an.instanceof(Buffer);
                    expect(response).to.be.an("object").and.not.equal(null);

                    done();
                });
        });

        it("call(getMe-data:null) | callback", function(done) {
            objBot
                .call("getMe", null, function(error, result, response) {
                    checkWithoutError(error);

                    expect(result).to.be.an.instanceof(Buffer);
                    expect(response).to.be.an("object").and.not.equal(null);

                    done();
                });
        });

        it("call(getFile) | callback", function(done) {
            objBot
                .call("getFile", {
                    "file_id": "AgADAgAD1qcxG2_R8AbjPe6-AjgFdozGWSoABAE2Gi-3QnhSD7wBAAEC"
                }, function(error, result, response) {
                    checkWithoutError(error);

                    expect(result).to.be.an.instanceof(Buffer);
                    expect(response).to.be.an("object").and.not.equal(null);

                    done();
                });
        });

        it("call(getFile-file_id:zero) | callback", function(done) {
            objBot
                .call("getFile", {
                    "file_id": "0"
                }, function(error, result, response) {
                    checkWithoutError(error);

                    expect(result).to.be.an.instanceof(Buffer);
                    expect(response).to.be.an("object").and.not.equal(null);

                    done();
                });
        });

        it("call(getFile) | callback-undefined", function() {
            objBot
                .call("getFile", {
                    "file_id": "AgADAgAD1qcxG2_R8AbjPe6-AjgFdozGWSoABAE2Gi-3QnhSD7wBAAEC"
                });
        });

        it("call(getFile-empty) | callback-undefined", function() {
            objBot
                .call("getFile", {
                    "file_id": "0"
                });
        });


        it("callJson(getMe-2args) | callback", function(done) {
            objBot
                .callJson("getMe", function(error, result, response) {
                    checkWithoutError(error);

                    expect(result).to.be.an("object").and.not.equal(null);
                    expect(response).to.be.an("object").and.not.equal(null);

                    expect(result).to.have.property("ok").to.equal(true);
                    expect(result).to.have.property("result").to.be.an("object").and.not.equal(null);

                    done();
                });
        });

        it("callJson(getMe-data:null) | callback", function(done) {
            objBot
                .callJson("getMe", null, function(error, result, response) {
                    checkWithoutError(error);

                    expect(result).to.be.an("object").and.not.equal(null);
                    expect(response).to.be.an("object").and.not.equal(null);

                    expect(result).to.have.property("ok").to.equal(true);
                    expect(result).to.have.property("result").to.be.an("object").and.not.equal(null);

                    done();
                });
        });

        it("callJson(getFile) | callback", function(done) {
            objBot
                .callJson("getFile", {
                    "file_id": "AgADAgAD1qcxG2_R8AbjPe6-AjgFdozGWSoABAE2Gi-3QnhSD7wBAAEC"
                }, function(error, result) {
                    checkWithoutError(error);

                    expect(result).to.be.an("object").and.not.equal(null);

                    expect(result).to.have.property("ok").to.equal(true);
                    expect(result).to.have.property("result").to.be.an("object").and.not.equal(null);

                    done();
                });
        });

        //-----------------]>

        it("download(stream) | callback", function(done) {
            objBot
                .download("BQADAgADEwADb9HwBoAUlahFM8WGAg", function(error, info) {
                    checkWithoutError(error);

                    expect(info).to.be.an("object").and.not.equal(null);

                    expect(info).to.have.property("id");
                    expect(info).to.have.property("file");
                    expect(info).to.have.property("size");
                    expect(info).to.have.property("stream");

                    done();
                });
        });

        it("download(stream) | promise", function(done) {
            objBot
                .download("BQADAgADEwADb9HwBoAUlahFM8WGAg")
                .then(function(info) {
                    expect(info).to.be.an("object").and.not.equal(null);

                    expect(info).to.have.property("id");
                    expect(info).to.have.property("file");
                    expect(info).to.have.property("size");
                    expect(info).to.have.property("stream");

                    done();
                }, function(error) {
                    checkWithoutError(error, done);
                });
        });

    });

    //-----------------]>

    describe("API", function() {

        it("forwardMessage | callback", function(done) {
            api.forwardMessage({
                "chat_id":      chatId,
                "from_chat_id": chatId,
                "message_id":   msgId
            }, function(error, data) {
                checkBaseFields(error, data);

                expect(data).to.have.property("forward_from").that.is.an("object");

                done();
            });
        });

        //--)>

        it("sendMessage | callback", function(done) {
            let data = {
                "chat_id":      chatId,
                "text":         "*bold Just* _italic markdown_ [XIII](db.gg)",
                "parse_mode":   "markdown"
            };

            let dataClone   = jsonClone(data);

            api.sendMessage(data, function(error, result) {
                checkSendMessage(error, result);

                expect(data).to.deep.equal(dataClone);

                done();
            });
        });

        it("sendMessage(file-stream) | callback", function(done) {
            api.sendMessage({
                "chat_id":      chatId,
                "text":        rFs.createReadStream(__dirname + "/data/msg.json")
            }, function(error, result) {
                checkBaseFields(error, result);

                expect(result).to.have.property("text").that.is.an("string");

                done();
            });
        });

        it("sendMessage(data-map) | callback", function(done) {
            const data = new Map([
                ["chat_id", chatId],
                ["text", "data-map"]
            ]);

            api.sendMessage(data, function(error, result) {
                checkBaseFields(error, result);

                expect(result).to.have.property("text").that.is.an("string");

                midEditText = result.message_id;

                done();
            });
        });

        //--)>

        it("sendPhoto(file) | array | callback", function(done) {
            api.sendPhoto([
                chatId,
                __dirname + "/data/MiElPotato.jpg",
                "MiElPotato"
            ], function(error, result) {
                checkBaseFields(error, result);

                expect(result).to.have.property("photo").that.is.an("array");

                midEditCaption = result.message_id;

                done();
            });
        });

        it("sendPhoto(file-stream) | callback", function(done) {
            api.sendPhoto({
                "chat_id":      chatId,
                "photo":        rFs.createReadStream(__dirname + "/data/MiElPotato.jpg"),
                "caption":      "MiElPotato"
            }, function(error, data) {
                checkBaseFields(error, data);

                expect(data).to.have.property("photo").that.is.an("array");

                done();
            });
        });

        it("sendPhoto(file-buffer) | callback", function(done) {
            api.sendPhoto({
                "chat_id":      chatId,
                "photo":        rFs.readFileSync(__dirname + "/data/MiElPotato.jpg"),
                "caption":      "MiElPotato",

                "filename":      "MiElPotato.jpg" // <-- It is important
            }, function(error, data) {
                checkBaseFields(error, data);

                expect(data).to.have.property("photo").that.is.an("array");

                done();
            });
        });

        it("sendPhoto(file_id) | callback", function(done) {
            api.sendPhoto({
                "chat_id":      chatId,
                "photo":        "AgADAgAD1qcxG2_R8AbjPe6-AjgFdozGWSoABAE2Gi-3QnhSD7wBAAEC"
            }, function(error, data) {
                checkBaseFields(error, data);

                expect(data).to.have.property("photo").that.is.an("array");

                done();
            });
        });

        //--)>

        it("sendAudio(url) | callback", function(done) {
            api.sendAudio({
                "chat_id":      chatId,
                "audio":        "http://upload.wikimedia.org/wikipedia/en/4/45/ACDC_-_Back_In_Black-sample.ogg",
                "performer":    "ACDC",
                "title":        "Back_In_Black",
                "duration":     1 // <-- Sec.
            }, function(error, data) {
                checkBaseFields(error, data);

                // https://core.telegram.org/bots/api#sendaudio
                expect(data).to.have.property("voice").that.is.an("object");

                done();
            });
        });

        it("sendDocument(url) | callback", function(done) {
            api.sendDocument({
                "chat_id":      chatId,
                "document":     "https://www.google.ru/images/logos/ps_logo2.png"
            }, function(error, data) {
                checkBaseFields(error, data);

                expect(data).to.have.property("document").that.is.an("object");

                done();
            });
        });

        it("sendDocument(url-redirect) | callback", function(done) {
            api.sendDocument({
                "chat_id":      chatId,
                "document":     "https://jigsaw.w3.org/HTTP/300/301.html"
            }, function(error, data) {
                checkBaseFields(error, data);

                expect(data).to.have.property("document").that.is.an("object");

                done();
            });
        });

        it("sendSticker(url) | callback", function(done) {
            api.sendSticker({
                "chat_id":      chatId,
                "sticker":     "https://www.google.ru/images/logos/ps_logo2.png"
            }, function(error, data) {
                checkBaseFields(error, data);

                expect(data).to.have.property("sticker").that.is.an("object");

                done();
            });
        });

        it("sendVideo(url) | callback", function(done) {
            api.sendVideo({
                "chat_id":      chatId,
                "video":        "http://www.quirksmode.org/html5/videos/big_buck_bunny.mp4",
                "duration":     60
            }, function(error, data) {
                checkBaseFields(error, data);

                expect(data).to.have.property("video").that.is.an("object");

                done();
            });
        });

        it("sendVoice(url) | callback", function(done) {
            api.sendVoice({
                "chat_id":      chatId,
                "voice":        "http://upload.wikimedia.org/wikipedia/en/4/45/ACDC_-_Back_In_Black-sample.ogg"
            }, function(error, result) {
                checkBaseFields(error, result);

                expect(result).to.have.property("voice").that.is.an("object");

                done();
            });
        });

        it("sendLocation | callback", function(done) {
            api.sendLocation({
                "chat_id":      chatId,
                "latitude":     "57.0061726",
                "longitude":    "40.9821055"
            }, function(error, result) {
                checkSendLocation(error, result);
                done();
            });
        });

        it("sendVenue | callback", function(done) {
            api.sendVenue({
                "chat_id":      chatId,
                "latitude":     "57.0061726",
                "longitude":    "40.9821055",
                "title":        "ATK",
                "address":      "Potatov Str."
            }, function(error, result) {
                checkBaseFields(error, result);
                done();
            });
        });

        it("sendContact | callback", function(done) {
            api.sendContact({
                "chat_id":      chatId,
                "phone_number": "+8 888 888 88 88",
                "first_name":   "Potatov Str."
            }, function(error, result) {
                checkBaseFields(error, result);
                done();
            });
        });

        it("sendChatAction | callback", function(done) {
            api.sendChatAction({
                "chat_id":      chatId,
                "action":       "typing"
            }, function(error, isOk) {
                checkWithoutError(error);
                expect(isOk).to.be.a("boolean");

                done();
            });
        });

        //-----)>

        it("editMessageText | callback", function(done) {
            const text = "EDITED";

            api.editMessageText({
                "chat_id":      chatId,
                "message_id":   midEditText,
                "text":         text
            }, function(error, result) {
                checkWithoutError(error);

                expect(result.text).to.be.a("string").and.equal(text);

                done();
            });
        });

        it("editMessageCaption | callback", function(done) {
            const caption = "EDITED";

            api.editMessageCaption({
                "chat_id":      chatId,
                "message_id":   midEditCaption,
                "caption":      caption
            }, function(error, result) {
                checkWithoutError(error);

                expect(result.caption).to.be.a("string").and.equal(caption);

                done();
            });
        });

        //-----)>

        it("setWebhook (set) | promise", function(done) {
            api
                .setWebhook({"url": "https://db.gg/null"})
                .then(function(isOk) {
                    expect(isOk).to.be.a("boolean").to.equal(true);

                    done();
                }, function(error) {
                    checkWithoutError(error, done);
                });
        });

        //-----)>

        it("deleteWebhook | promise", function(done) {
            api
                .deleteWebhook()
                .then(function(isOk) {
                    expect(isOk).to.be.a("boolean").to.equal(true);

                    done();
                }, function(error) {
                    checkWithoutError(error, done);
                });
        });

        //-----)>

        it("getUserProfilePhotos | callback", function(done) {
            api.getUserProfilePhotos({
                "user_id":      chatId
            }, function(error, data) {
                checkWithoutError(error);

                expect(data).to.have.property("photos").that.is.an("array");

                done();
            });
        });

        it("getUpdates | callback", function(done) {
            api.getUpdates(function(error, data) {
                checkWithoutError(error);
                expect(data).to.be.a("array");

                done();
            });
        });

        //--)>

        it("getFile | callback", function(done) {
            api.getFile({
                "file_id": "AgADAgAD1qcxG2_R8AbjPe6-AjgFdozGWSoABAE2Gi-3QnhSD7wBAAEC"
            }, function(error, data) {
                checkWithoutError(error);
                expect(data).to.be.an("object").and.not.equal(null);

                expect(data).to.have.property("file_id");

                done();
            });
        });

        //--)>

        it("getMe | callback", function(done) {
            api.getMe(function(error, data) {
                checkWithoutError(error);
                expect(data).to.be.an("object").and.not.equal(null);

                expect(data).to.have.property("id").that.is.an("number");
                expect(data).to.have.property("first_name").that.is.an("string");
                expect(data).to.have.property("username").that.is.an("string");

                done();
            });
        });

        it("getWebhookInfo | promise", function(done) {
            api
                .getWebhookInfo()
                .then(function(data) {
                    expect(data).to.be.an("object").and.not.equal(null);

                    expect(data).to.have.property("url").that.is.an("string");

                    done();
                }, function(error) {
                    checkWithoutError(error, done);
                });
        });

    });

});

//----------------------------------]>

function checkSendMessage(error, data) {
    checkBaseFields(error, data);
    expect(data).to.have.property("text").that.is.an("string");
}

function checkSendLocation(error, data) {
    checkBaseFields(error, data);
    expect(data).to.have.property("location").that.is.an("object");
}

//-----------]>

/*
function checkWithError(error, done) {
    if(done) {
        setTimeout(function() {
            expect(error).to.be.an.instanceof(Error);
            done();
        }, 0);
    }
    else {
        expect(error).to.be.an.instanceof(Error);
    }
}
*/

function checkWithoutError(error, done) {
    if(done) {
        setTimeout(function() {
            expect(error).to.be.null;
            done();
        }, 0);
    }
    else {
        expect(error).to.be.null;
    }
}

//-----------]>

function checkBaseFields(error, data) {
    checkWithoutError(error);

    expect(data).to.be.an("object").and.not.equal(null);

    expect(data).to.have.property("message_id");
    expect(data).to.have.property("from").that.is.an("object");
    expect(data).to.have.property("chat").that.is.an("object");
    expect(data).to.have.property("date");
}

//-------[HELPERS]-------}>

function jsonClone(data) {
    return JSON.parse(JSON.stringify(data));
}