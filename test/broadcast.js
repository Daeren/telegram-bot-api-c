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

        gBotFather.broadcast(ids, data, function(error, lastIndex) {
            expect(error).to.be.an.instanceof(Error);
            expect(lastIndex).to.equal(1);

            done();
        });
    });

    it("[id, fake, id] | stop-callback", function(done) {
        const ids   = [chatId, "-", chatId],
              data  = {"text": "Hi"};

        const bProc = gBotFather.broadcast(ids, data, function(error, lastIndex) {
            expect(error).to.be.null;
            expect(lastIndex).to.equal(0);

            done();
        });

        bProc.stop();
    });

    it("[id, id, id] | callback", function(done) {
        const ids   = [chatId, chatId, chatId],
              data  = {"text": "Hi"};

        gBotFather.broadcast(ids, data, function(error, lastIndex) {
            expect(error).to.be.null;
            expect(lastIndex).to.equal(2);

            done();
        });
    });
});