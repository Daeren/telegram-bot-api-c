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

const gErrors   = require("./../src/errors");

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

describe("errors", function() {
    this.timeout(1000 * 10);

    //-----------------]>

    it("base", function() {
        expect(gErrors).to.be.a("function");

        //-----]>

        const object = gErrors(Object.create(null));

        for(let name in object) {
            if(hasOwnProperty.call(object, name)) {
                expect(gErrors).to.have.property(name);
            }
        }

        for(let name in gErrors) {
            if(hasOwnProperty.call(gErrors, name)) {
                expect(object).to.have.property(name);
                expect(rBot).to.have.property(name);
            }
        }
    });

    //-----------------]>

    it("check API", function(done) {
        objBot.api.setWebhook({"url": "https://db.gg/test"}, onEnd);

        function onEnd(error, isOk) {
            expect(error).to.be.null;
            expect(isOk).to.be.a("boolean").and.equal(true);

            objBot.callJson("getUpdates", function(error, data) {
                const code = data.error_code;

                expect(code).to.equal(rBot.ERR_USED_WEBHOOK);
                expect(code).to.equal(objBot.ERR_USED_WEBHOOK);

                done();
            });
        }
    });

});