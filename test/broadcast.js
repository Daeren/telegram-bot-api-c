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

    it("", function(done) {
        done();
    });
});

//----------------------------------]>

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