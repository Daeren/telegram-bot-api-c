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

const rBot      = require("./../index");

const CResponseBuilder = require("./../src/server/responseBuilder");

//-----------------------------------------------------

const token         = process.env.TELEGRAM_BOT_TOKEN,
      chatId        = process.env.TELEGRAM_CHAT_ID,
      msgId         = process.env.TELEGRAM_MSG_ID;

const objBot        = rBot(token);

const gBotReq       = {
    "cid": chatId,
    "mid": msgId
};

const gCreateRB = function() { return new CResponseBuilder(gBotReq, objBot); };

const gElements = [
    "text", "photo", "audio", "document", "sticker", "video", "voice", "location", "venue", "contact", "chatAction", "game",

    "inlineQuery", "callbackQuery",

    "markdown", "html"
];

const gModifiers = [
    "keyboard",

    "maxSize", "filename",

    "latitude", "longitude",
    "caption", "duration", "performer", "title", "width", "height",
    "gameShortName",

    "disableWebPagePreview", "disableNotification",
    "showAlert",
    "cacheTime", "nextOffset", "switchPmText", "switchPmParameter",

    "phoneNumber", "firstName", "lastName",
    "parseMode", "replyMarkup",

    "replyToMessageId", "messageId", "inlineMessageId"
];

//-----------------------------------------------------

expect(token).to.exist;
expect(chatId).to.exist;
expect(msgId).to.exist;

//-----------------------------------------------------

describe("CResponseBuilder", function() {
    this.timeout(1000 * 10);

    //-----------------]>

    describe("Methods", function() {
        const rb = gCreateRB();

        ["send", "isReply"]
            .concat(gElements, gModifiers)
            .forEach(function(method) {
                it(method, function() {
                    expect(rb).to.have.property(method).that.is.an("function");
                });
            });
    });

    //-----------------]>

    describe("Build", function() {

        describe("Elements", function() {
            const rb = gCreateRB();

            gElements
                .forEach(function(element) {
                    it(element, function() {
                        const func = rb[element];

                        expect(func).to.be.a("function");

                        //-------]>

                        const r = rb[element]();

                        expect(r).to.equal(rb);
                    });
                });
        });

        describe("Modifiers", function() {
            const rb = gCreateRB().text("test");

            gModifiers
                .forEach(function(modifier) {
                    it(modifier, function() {
                        const func = rb[modifier];

                        expect(func).to.be.a("function");

                        //-------]>

                        const r = rb[modifier]();

                        expect(r).to.equal(rb);
                    });
                });
        });

    });

    //-----------------]>

    describe("Send", function() {
        const rb = gCreateRB();

        it("send(photo-url) | promise", function(done) {
            const url = "https://www.google.ru/images/logos/ps_logo2.png";

            //----------]>

            rb
                .chatAction("typing")
                .photo(url)
                .keyboard("1 2 3");

            //----------]>

            let lastElement = rb.lastElement;

            expect(lastElement.reply_markup).to.deep.equal(objBot.keyboard("1 2 3"));

            //----------]>

            rb.send()
                .then(function(result) {
                    expect(result).to.be.a("array");

                    done();
                }, function(error) {
                    checkError(error);
                    done();
                });
        });

        it("send(text) | callback", function(done) {
            let lastElement = rb.lastElement;

            //----------]>

            expect(rb.queue).to.equal(null);
            expect(lastElement).to.equal(null);

            //----------]>

            rb
                .text("test")
                .keyboard();

            lastElement = rb.lastElement;

            //----------]>

            expect(lastElement).to.be.a("object");
            expect(lastElement.reply_markup).to.deep.equal(objBot.keyboard());

            //----------]>

            rb
                .send(function(error, result) {
                    checkSendMessage(error, result);

                    done();
                });
        });

        it("send(text).oneElem | callback", function(done) {
            gCreateRB()
                .text("test")
                .send(function(error, result) {
                    checkSendMessage(error, result);

                    done();
                });
        });

        it("send(location).oneElem | callback", function(done) {
            gCreateRB()
                .location(50, 60)
                .send(function(error, result) {
                    checkBaseFields(error, result);

                    done();
                });
        });

        it("send(markdown).oneElem | callback", function(done) {
            gCreateRB()
                .markdown("*TEST*", false, true)
                .send(function(error, result) {
                    checkBaseFields(error, result);

                    done();
                });
        });

    });
});

//----------------------------------]>

function checkSendMessage(error, data) {
    checkBaseFields(error, data);
    expect(data).to.have.property("text").that.is.an("string");
}

//-----------]>

function checkError(error) {
    if(error) {
        expect(error).to.be.an.instanceof(Error);
    }

    setTimeout(function() {
        expect(error).to.be.null;
    }, 0);
}

//-----------]>

function checkBaseFields(error, result) {
    checkError(error);

    expect(result).to.be.a("object");

    expect(result).to.have.property("message_id");
    expect(result).to.have.property("from").that.is.an("object");
    expect(result).to.have.property("chat").that.is.an("object");
    expect(result).to.have.property("date");
}