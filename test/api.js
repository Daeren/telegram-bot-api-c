﻿//-----------------------------------------------------
//
// Author: Daeren Torn
// Site: 666.io
//
//-----------------------------------------------------

"use strict";

//-----------------------------------------------------

const rChai     = require("chai");

const assert    = rChai.assert,
      expect    = rChai.expect;

const rBot      = require("./../index");

//-----------------------------------------------------

const token     = process.env.TELEGRAM_BOT_TOKEN,
      chatId    = process.env.TELEGRAM_CHAT_ID,
      msgId     = process.env.TELEGRAM_MSG_ID;

const objBot    = rBot(token);

const api       = objBot.api,
      keyboard  = objBot.keyboard,

      parseCmd  = objBot.parseCmd;

//-----------------------------------------------------

expect(token).to.exist;
expect(chatId).to.exist;
expect(msgId).to.exist;

//----------------------------------]>

describe("Instance: bot", function() {
    this.timeout(1000 * 10);

    //-----------------]>

    describe("Property", function() {

        const botMethods = [
            "setToken",
            "call", "callJson",
            "send", "download",
            "server", "polling",
            "parseCmd"
        ];

        //-----------------]>

        it("api", function() {
            const apiMethods = [
                "getMe", "forwardMessage",
                "sendMessage", "sendPhoto", "sendAudio", "sendDocument", "sendSticker", "sendVideo", "sendVoice", "sendLocation", "sendChatAction",
                "getUserProfilePhotos", "getUpdates", "getFile",
                "setWebhook"
            ];

            expect(api).to.be.a("object");

            for(let method of apiMethods)
                expect(api).to.have.property(method);
        });

        for(let method of botMethods)
            it(method, function() {
                expect(objBot).to.have.property(method).that.is.an("function");
            });

    });

    //-----------------]>

    describe("Method", function() {

        it("keyboard", function() {
            let buttons;

            //-----]>

            buttons = keyboard.hOxOnce;

            expect(buttons).to.be.a("object");

            expect(buttons).to.have.property("keyboard").that.is.an("array");

            //-----]>

            buttons = keyboard("X Y Z");

            expect(buttons).to.be.a("object");

            expect(buttons).to.have.property("keyboard").that.is.an("array");

            //-----]>

            buttons = keyboard([["X"]], "resize once selective");

            expect(buttons).to.be.a("object");

            expect(buttons).to.have.property("keyboard").that.is.an("array");
            expect(buttons).to.have.property("resize_keyboard");
            expect(buttons).to.have.property("one_time_keyboard");
            expect(buttons).to.have.property("selective");

        });

        //------)>

        describe("parseCmd | normal", function() {
            const cmdSelf = "/start",
                cmdName = "start",
                cmdText = "[text]";

            let normalCmds = [
                "/start [text]", "/start@bot [text]", "@bot /start [text]"
            ];

            //-----]>

            for(let cmd of normalCmds)
                it(cmd, function() {
                    let t = parseCmd(cmd);

                    expect(t).to.be.a("object");

                    expect(t).to.have.property("name").that.is.equal(cmdName);
                    expect(t).to.have.property("text").that.is.equal(cmdText);
                    expect(t).to.have.property("cmd").that.is.equal(cmdSelf);
                });

            //-----------------]>

            normalCmds = [
                "/start /[text]", "/start@bot /[text]", "@bot /start /[text]"
            ];

            //-----]>

            for(let cmd of normalCmds)
                it(cmd, function() {
                    let t = parseCmd(cmd);

                    expect(t).to.be.a("object");

                    expect(t).to.have.property("name").that.is.equal(cmdName);
                    expect(t).to.have.property("text").that.is.equal("/" + cmdText);
                    expect(t).to.have.property("cmd").that.is.equal(cmdSelf);
                });
        });

        describe("parseCmd | fake", function() {
            const fakeCmds = [
                "@bot [text]","@bot / [text]",
                "/", "/ [text]",
                "@ [text]", "@ / [text]", " / [text]"
            ];

            //-----]>

            for(let cmd of fakeCmds)
                it(cmd, function() {
                    expect(parseCmd(cmd)).to.be.null;
                });
        });

        //-----------------]>

        it("call(getFile) | callback", function(done) {
            objBot
                .call("getFile", {
                    "file_id": "AgADAgAD1qcxG2_R8AbjPe6-AjgFdozGWSoABAE2Gi-3QnhSD7wBAAEC"
                }, function(error, result) {
                    expect(error).to.be.null;
                    expect(result).to.be.an.instanceof(Buffer);

                    done();
                });
        });

        it("callJson(getFile) | callback", function(done) {
            objBot
                .callJson("getFile", {
                    "file_id": "AgADAgAD1qcxG2_R8AbjPe6-AjgFdozGWSoABAE2Gi-3QnhSD7wBAAEC"
                }, function(error, result) {
                    expect(error).to.be.null;
                    expect(result).to.be.a("object");

                    expect(result).to.have.property("ok");
                    expect(result).to.have.property("result");

                    done();
                });
        });

        //-----------------]>

        it("download(stream) | callback", function(done) {
            objBot
                .download("BQADAgADEwADb9HwBoAUlahFM8WGAg", function(error, info) {
                    expect(error).to.be.null;
                    expect(info).to.be.a("object");

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
                    expect(info).to.be.a("object");

                    expect(info).to.have.property("id");
                    expect(info).to.have.property("file");
                    expect(info).to.have.property("size");
                    expect(info).to.have.property("stream");

                    done();
                }, function(error) {
                    expect(error).to.be.an.instanceof(Error);
                    expect(error).to.be.null;

                    done();
                });
        });

        //-----------------]>

        it("send(text) | callback", function(done) {
            let data = {"text": "Hi"};

            objBot.send(chatId, data, function(error, data) {
                checkBaseFields(error, data);

                expect(data).to.have.property("text").that.is.an("string");

                done();
            });
        });


        it("send(photo) | callback", function(done) {
            const url = "https://www.google.ru/images/logos/ps_logo2.png";
            const request = require("https").get(url);

            //----------]>

            request
                .on("error", function(error) {
                    expect(error).to.be.null;

                    done();
                })
                .on("response", function(response) {
                    let data = {"photo": response};

                    objBot.send(chatId, data, function(error, data) {
                        checkBaseFields(error, data);

                        expect(data).to.have.property("photo").that.is.an("array");

                        done();
                    });
                });
        });

        it("send(array) | promise", function(done) {
            let data = [
                {"chatAction": "typing"},
                {"text": "Hi"},
                {"location": "57.0061726 40.9821055"}
            ];

            objBot
                .send(chatId, data)
                .then(function(result) {
                    expect(result).to.be.a("object");

                    expect(result).to.have.property("chatAction").that.is.an("array");
                    expect(result).to.have.property("text").that.is.an("array");

                    done();
                }, function(error) {
                    expect(error).to.be.an.instanceof(Error);
                    expect(error).to.be.null;

                    done();
                });
        });

        //-----------------]>

        it("polling", function(done) {
            const options  = {
                "limit":    100,
                "timeout":  0,
                "interval": 10
            };

            let srv;

            //---------]>

            srv = objBot.polling();

            expect(srv).to.be.a("object");
            expect(srv).to.have.property("start").that.is.an("function");
            expect(srv).to.have.property("stop").that.is.an("function");

            srv.stop();

            //---------]>

            srv = objBot.polling(options);

            expect(srv).to.be.a("object");
            expect(srv).to.have.property("start").that.is.an("function");
            expect(srv).to.have.property("stop").that.is.an("function");

            srv.stop();

            //---------]>

            srv = objBot.polling(function() {});

            expect(srv).to.be.a("object");
            expect(srv).to.have.property("start").that.is.an("function");
            expect(srv).to.have.property("stop").that.is.an("function");

            srv.stop();

            //---------]>

            srv = objBot.polling(options, function() {});

            expect(srv).to.be.a("object");
            expect(srv).to.have.property("start").that.is.an("function");
            expect(srv).to.have.property("stop").that.is.an("function");

            srv.stop();

            //---------]>

            done();
        });

    });

    //-----------------]>

    describe("API", function() {

        it("sendMessage | callback", function(done) {
            api.sendMessage({
                "chat_id":      chatId,
                "text":         "*bold Just* _italic markdown_ [XIII](db.gg)",
                "parse_mode":   "markdown"
            }, function(error, data) {
                checkBaseFields(error, data);

                expect(data).to.have.property("text").that.is.an("string");

                done();
            });
        });

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

        it("sendPhoto(url) | callback", function(done) {
            api.sendPhoto({
                "chat_id":      chatId,
                "photo":        __dirname + "/MiElPotato.jpg",
                "caption":      "MiElPotato"
            }, function(error, data) {
                checkBaseFields(error, data);

                expect(data).to.have.property("photo").that.is.an("array");

                done();
            });
        });

        it("sendAudio(url) | callback", function(done) {
            api.sendAudio({
                "chat_id":      chatId,
                "audio":        "http://upload.wikimedia.org/wikipedia/en/4/45/ACDC_-_Back_In_Black-sample.ogg",
                "performer":    "ACDC",
                "title":        "Back_In_Black",
                "duration":     1 // <-- Sec.
            }, function(error, data) {
                checkBaseFields(error, data);

                expect(data).to.have.property("audio").that.is.an("object");

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
            }, function(error, data) {
                checkBaseFields(error, data);

                expect(data).to.have.property("voice").that.is.an("object");

                done();
            });
        });

        it("sendLocation | callback", function(done) {
            api.sendLocation({
                "chat_id":      chatId,
                "latitude":     "57.0061726",
                "longitude":    "40.9821055"
            }, function(error, data) {
                checkBaseFields(error, data);

                expect(data).to.have.property("location").that.is.an("object");

                done();
            });
        });

        it("sendChatAction | callback", function(done) {
            api.sendChatAction({
                "chat_id":      chatId,
                "action":       "typing"
            }, function(error, isOk) {
                expect(error).to.be.null;
                expect(isOk).to.be.a("boolean");

                done();
            });
        });

        //-----)>

        it("getUserProfilePhotos | callback", function(done) {
            api.getUserProfilePhotos({
                "user_id":      chatId
            }, function(error, data) {
                expect(error).to.be.null;

                expect(data).to.have.property("photos").that.is.an("array");

                done();
            });
        });

        it("getUpdates | callback", function(done) {
            api.getUpdates(function(error, data) {
                expect(error).to.be.null;
                expect(data).to.be.a("array");

                done();
            });
        });

        //-----)>

        it("setWebhook | promise", function(done) {
            api
                .setWebhook()
                .then(function(isOk) {
                    expect(isOk).to.be.a("boolean");

                    done();
                }, function(error) {
                    expect(error).to.be.an.instanceof(Error);
                    expect(error).to.be.null;

                    done();
                });
        });

        //-----)>

        it("getFile | callback", function(done) {
            api.getFile({
                "file_id": "AgADAgAD1qcxG2_R8AbjPe6-AjgFdozGWSoABAE2Gi-3QnhSD7wBAAEC"
            }, function(error, data) {
                expect(error).to.be.null;
                expect(data).to.be.a("object");

                expect(data).to.have.property("file_id");

                done();
            });
        });

        //-----)>

        it("getMe | callback", function(done) {
            api.getMe(function(error, data) {
                expect(error).to.be.null;
                expect(data).to.be.a("object");

                expect(data).to.have.property("id").that.is.an("number");
                expect(data).to.have.property("first_name").that.is.an("string");
                expect(data).to.have.property("username").that.is.an("string");

                done();
            });
        });

        it("getMe | promise", function(done) {
            api
                .getMe()
                .then(function(data) {
                    expect(data).to.be.a("object");

                    expect(data).to.have.property("id").that.is.an("number");
                    expect(data).to.have.property("first_name").that.is.an("string");
                    expect(data).to.have.property("username").that.is.an("string");

                    done();
                }, function(error) {
                    expect(error).to.be.an.instanceof(Error);
                    expect(error).to.be.null;

                    done();
                });
        });

    });

});

//----------------------------------]>

function checkBaseFields(error, data) {
    expect(error).to.be.null;
    expect(data).to.be.a("object");

    expect(data).to.have.property("message_id");
    expect(data).to.have.property("from").that.is.an("object");
    expect(data).to.have.property("chat").that.is.an("object");
    expect(data).to.have.property("date");
}