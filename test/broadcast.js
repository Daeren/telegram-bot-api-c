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

//-----------------------------------------------------

const token         = process.env.TELEGRAM_BOT_TOKEN,
      chatId        = process.env.TELEGRAM_CHAT_ID,
      msgId         = process.env.TELEGRAM_MSG_ID;

const gBotFather    = rBot(token);

//-----------------------------------------------------

expect(token).to.exist;
expect(chatId).to.exist;
expect(msgId).to.exist;

//-----------------------------------------------------

describe("broadcast", function() {
    this.timeout(1000 * 10);

    //-----------------]>

    it("[id, fake, id] | callback", function(done) {
        const ids   = [chatId, "-", chatId],
              data  = {"text": "Hi"};

        gBotFather
            .broadcast(ids, data, function(error) {
                expect(error).to.be.an.instanceof(Error);
                expect(error).to.have.property("index").that.is.an("number");
                expect(error.index).to.equal(1);

                done();
            });
    });

    it("[id, fake, id] | promise", function(done) {
        const ids   = [chatId, "-", chatId],
              data  = {"text": "Hi"};

        gBotFather
            .broadcast(ids, data)
            .then(done, function(error) {
                expect(error).to.be.an.instanceof(Error);
                expect(error).to.have.property("index").that.is.an("number");
                expect(error.index).to.equal(1);

                done();
            });
    });

    it("[id, id] | promise", function(done) {
        const ids   = [chatId, chatId],
              data  = {"text": "Hi"};

        gBotFather
            .broadcast(ids, data)
            .then(done, function(error) {
                checkError(error, done);
            });
    });
});

//----------------------------------]>

function checkError(error, done) {
    if(error) {
        expect(error).to.be.an.instanceof(Error);
    }

    setTimeout(function() {
        expect(error).to.be.null;
        done();
    }, 0);
}