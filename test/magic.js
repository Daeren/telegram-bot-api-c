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

var id      = "59725308",

    file    = __dirname + "/MiElPotato.jpg",

    i       = objBot.i,
    send    = objBot.send;

//------------------]>

i()
    .then(JSON.parse)
    .then(function(json) {
        return send(id, [{"chatAction": "upload_photo"}, {"message": ""}, {"message": json}]);
    })
    .then(function(results) {
        for(var name in results)
            console.log("Name: %s\n%s\n\n", name, results[name].toString());
    })
    .then(function() {
        return send(id, {"photo": require("fs").createReadStream(file)});
    })
    //.then(function() {
    //    return send(id, {"photo": file});
    //})
    //.then(JSON.parse)
    //.then(function(json) {
    //    return send(id, {"photo": json.result.photo[0].file_id, "caption": "Hell World!"});
    //})
    //.then(function() {
        //return send(id, {"location": {"latitude": "57.0061726", "longitude": "40.9821055"}});
        //return send(id, {"location": "57.0061726 40.9821055"});
        //return send(id, {"location": true, "latitude": "57.0061726", "longitude": "40.9821055"});

        //return send(id, {"photo": "AgADAgADy6cxG8ZgFQgTCrxCN-ApkUHUWSoABElgRLZEQgpbZqUBAAEC"});
    //})
    .then(JSON.parse)
    .then(console.info, console.error);


return;


var data = {
    "chat_id":  id,
    "action":   "typing"
};

objBot.call("sendChatAction", data, function(error, body, response) {});


