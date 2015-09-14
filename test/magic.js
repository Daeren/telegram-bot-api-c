//-----------------------------------------------------
//
// Author: Daeren Torn
// Site: 666.io
//
//-----------------------------------------------------

"use strict";

//-----------------------------------------------------

var rBot = require("./../index");

//-----------------------------------------------------

var objBot  = new rBot(process.env.TELEGRAM_BOT_TOKEN);
var api = objBot.api;

//-----------------------------------------------------

objBot.call("sendMessage", {
    "chat_id":      "-34042985",
    "text":         "*bold Just* _italic markdown_ [Daeren](666.io)",
    "parse_mode":   "markdown"
});

return;


api
    .setWebhook()
    .then(() => api.getUpdates())
    .then(JSON.parse)
    .then(console.log, console.error);

return;


var file    = __dirname + "/MiElPotato.jpg",
    data    = () => ({"chat_id": "-34042985", "text": "Date: " + Date.now()});


api.sendMessage(data(), function() {
    api.sendMessage(data())

        .then(data)
        .then(x => api.sendMessage(x))

        .then(data)
        .then(x => {
            x.photo = file;
            api.sendPhoto(x);
        });
});

return;


var id      = "59725308",
    file    = __dirname + "/MiElPotato.jpg",

    send    = objBot.send;

api.getMe()
    .then(JSON.parse)
    .then(data => send(id, [{"chatAction": "upload_photo"}, {"message": data}]))

    .then(results => {
        for(var name in results)
            console.log("Name: %s\n%s\n\n", name, results[name].toString());
    })

    .then(() => send(id, {"photo": require("fs").createReadStream(file)}))
    .then(() => send(id, {"photo": file}))
    .then(JSON.parse)
    .then(data => send(id, {"photo": data.result.photo[0].file_id, "caption": "Hell World!"}))

    .then(function() {
        //return send(id, {"location": {"latitude": "57.0061726", "longitude": "40.9821055"}});
        return send(id, {"location": "57.0061726 40.9821055"});
        //return send(id, {"location": true, "latitude": "57.0061726", "longitude": "40.9821055"});
        //
        //return send(id, {"photo": "AgADAgADy6cxG8ZgFQgTCrxCN-ApkUHUWSoABElgRLZEQgpbZqUBAAEC"});
    });

return;