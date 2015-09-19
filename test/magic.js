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

var objBot = rBot(process.env.TELEGRAM_BOT_TOKEN);
var api = objBot.api;

//-----------------------------------------------------

objBot
    .download("AgADAgAD1qcxG2_R8AbjPe6-AjgFdozGWSoABAE2Gi-3QnhSD7wBAAEC", "O:/")
    .then(console.log, console.error);

return;


objBot.call("getFile", {
    "file_id": "AgADAgAD1qcxG2_R8AbjPe6-AjgFdozGWSoABAE2Gi-3QnhSD7wBAAEC"
}, function(e, r) {
    console.log(e, r && r.toString());
});

return;


objBot.call("sendAudio", {
    "chat_id":      "-20838162",
    "audio":        "https://www.",
    "title":        "MiElPotato",
    "duration":     1 // <-- Sec.
}, function(e, r) {
    console.log(e, r && r.toString());
});

return;


objBot.call("sendPhoto", {
    "chat_id":      "-34042985",
    //"photo":        "http://t06.deviantart.net/qyUrU3vLOjw1UcX6r5HPZO1Xat4=/300x200/filters:fixed_height(100,100):origin()/pre09/4e03/th/pre/i/2011/281/a/2/superman__s_profile_picture_by_agustinus-d4c6c97.jpg"
    "photo":        "https://www.google.ru/images/logos/ps_logo2.png"
}, function(e, r) {
    console.log(e, r && r.toString());
});

return;


var options = {
    host: "t06.deviantart.net",
    path: "qyUrU3vLOjw1UcX6r5HPZO1Xat4=/300x200/filters:fixed_height(100,100):origin()/pre09/4e03/th/pre/i/2011/281/a/2/superman__s_profile_picture_by_agustinus-d4c6c97.jpg"
};

var request = require("http").get(options);

request.on("response", function(res) {
    objBot.call("sendPhoto", {
        "chat_id":      "-34042985",
        "photo":        res
    }, function(e, r) {
        console.log(e, r && r.toString());
    });
});

return;


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
    .then(data => send(id, [{"chatAction": "upload_photo"}, {"text": data}]))

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