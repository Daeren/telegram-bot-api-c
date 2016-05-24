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

const objBot        = rBot(token);

//-----------------------------------------------------

expect(token).to.exist;
expect(chatId).to.exist;
expect(msgId).to.exist;

//-----------------------------------------------------

describe("srv.polling", function() {

    this.timeout(1000 * 10);

    //-----------------]>

    it("Base", function() {
        expect(objBot.polling).to.be.a("function");
    });

    //-----------------]>

    it("Instance", function() {
        const options  = {
            "limit":    100,
            "timeout":  0,
            "interval": 10
        };

        let servers = [
            objBot.polling(),
            objBot.polling(function() { }),
            objBot.polling(options, function() { })
        ];

        servers.forEach(function(srv) {
            expect(srv).to.be.an("object").and.not.equal(null);

            expect(srv).to.have.property("start").that.is.a("function");
            expect(srv).to.have.property("stop").that.is.a("function");

            expect(srv).to.have.property("catch").that.is.a("function");
            expect(srv).to.have.property("use").that.is.a("function");
            expect(srv).to.have.property("on").that.is.a("function");
            expect(srv).to.have.property("off").that.is.a("function");

            srv.stop();
        });
    });
});
