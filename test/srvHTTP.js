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

describe("srv.http", function() {

    this.timeout(1000 * 10);

    //-----------------]>

    it("Base", function() {
        expect(objBot.http).to.be.a("function");
    });

    //-----------------]>

    it("Instance", function() {
        let servers = [
            objBot.http({"ssl": false, "port": 1379}),
            objBot.http(function() { }),
            objBot.http({"ssl": false, "port": 1346}, function() { })
        ];

        servers.forEach(function(srv) {
            expect(srv).to.be.an("object").and.not.equal(null);

            expect(srv).to.have.property("app").that.is.an("object").and.not.equal(null);
            expect(srv).to.have.property("bot").that.is.a("function");

            expect(srv).to.have.property("catch").that.is.a("function");
            expect(srv).to.have.property("use").that.is.a("function");
            expect(srv).to.have.property("on").that.is.a("function");
            expect(srv).to.have.property("off").that.is.a("function");
        });
    });

});
