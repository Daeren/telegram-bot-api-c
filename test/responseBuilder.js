//-----------------------------------------------------
//
// Author: Daeren Torn
// Site: 666.io
//
//-----------------------------------------------------

/*jshint expr: true*/

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

const gBotFather    = rBot(token);

const gBotReq       = {
    "cid": chatId,
    "mid": msgId
};

const gCreateRB = function() { return new CResponseBuilder(gBotReq, gBotFather); };

const gElements = [
    "text", "photo", "audio", "document", "sticker", "video", "voice", "location", "chatAction"
];

const gModifiers = [
    "keyboard",

    "maxSize", "filename",
    "latitude", "longitude",

    "disableWebPagePreview",
    "parseMode",
    "caption", "duration", "performer", "title",
    "replyToMessageId"
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

        ["send"]
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

            rb
                .chatAction("typing")

                .photo(url)
                .keyboard("1 2 3")

                .send()
                .then(function(result) {
                    expect(result).to.be.a("object");

                    expect(result).to.have.property("chatAction").that.is.an("array");
                    expect(result).to.have.property("photo").that.is.an("array");

                    done();
                }, function(error) {
                    checkPromiseError(error);
                    done();
                });
        });

        it("send(text) | callback", function(done) {
            expect(rb.queue).to.be.empty;
            expect(rb.lastElement).to.equal(null);

            rb
                .text("test")
                .keyboard()
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

    });
});

//----------------------------------]>

function checkSendMessage(error, data) {
    checkBaseFields(error, data);
    expect(data).to.have.property("text").that.is.an("string");
}

//-----------]>

function checkCallbackError(error) {
    if(error) {
        expect(error).to.be.an.instanceof(Error);
    }

    expect(error).to.be.null;
}

function checkPromiseError(error) {
    expect(error).to.be.an.instanceof(Error);
    expect(error).to.be.null;
}

//-----------]>

function checkBaseFields(error, data) {
    checkCallbackError(error);
    expect(data).to.be.a("object");

    expect(data).to.have.property("message_id");
    expect(data).to.have.property("from").that.is.an("object");
    expect(data).to.have.property("chat").that.is.an("object");
    expect(data).to.have.property("date");
}