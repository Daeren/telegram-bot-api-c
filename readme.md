`npm install telegram-bot-api-c`


```js
var rBot = require("telegram-bot-api-c");

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
    .then(function() {
        return send(id, {"photo": file});
    })
    .then(JSON.parse)
    .then(function(json) {
        return send(id, {"photo": json.result.photo[0].file_id, "caption": "Hell World!"});
    })
    .then(JSON.parse)
    .then(console.info, console.error);

//-----------------------------]>

var data = {
    "chat_id":  id,
    "action":   "typing"
};

objBot.call("sendChatAction", data);
```


#### Server (RC 2)

```js
var rBot = require("telegram-bot-api-c");

//-----------------------------------------------------

var objBot  = new rBot(process.env.TELEGRAM_BOT_TOKEN);

var gSrvOptions = {
    "certDir":  "/www/site",

    "key":       "/3_site.xx.key",
    "cert":      "/2_site.xx.crt",
    "ca":       [
        "/AddTrustExternalCARoot.crt",
        "/COMODORSAAddTrustCA.crt",
        "/COMODORSADomainValidationSecureServerCA.crt"
    ],

    "http":     false, //_ nginx + nodejs = <3
    "host":     "site.xx"
};

//------------------]>

objBot
    .createServer(gSrvOptions, cbServer)
    .command("feedback", cbCmdFeedback);

//------------------]>

function cbServer(data) {
    var msgChat = data.message.chat;

    //----------------]>

    this.id = msgChat.id;

    this.i()
        .then(() => {
            this.data.chatAction = "typing";
            return this.send();
        })
        .then(() => {
            this.data.message = "Use: /feedback";
            return this.send();
        });
}

function cbCmdFeedback(data, params) {
    var msgChat = data.message.chat;

    //----------------]>

    this.id = msgChat.id;
    this.data.message = "I'm feedback!";

    this.send();
}
```

[Telegram Bot API][2]


| Method          | Arguments                                           | Return                            |
|-----------------|-----------------------------------------------------|-----------------------------------|
|                 | -                                                   |                                   |
| call            | method, data[, callback(error, buffer, response)]   |                                   |
| callJson        | method, data[, callback(error, json, response)]     |                                   |
|                 | -                                                   |                                   |
| send            | id, data[, callback]                                | promise or undefined              |
| i               | [callback]                                          | promise or undefined              |
|                 | -                                                   |                                   |
| createServer    | options, callback(json, request)                    | new instance of https.Server      |
|                 | -                                                   |                                   |
| setToken        | token                                               | this                              |


#### Method: send

| Name          | Type                                  | Note                                      |
|---------------|---------------------------------------|-------------------------------------------|
|               | -                                     |                                           |
| message       | string, json                          |                                           |
| photo         | string, stream                        | Ext: jpg, jpeg, gif, tif, png, bmp        |
| audio         | string, stream                        | Ext: mp3                                  |
| document      | string, stream                        |                                           |
| sticker       | string, stream                        | Ext: webp, jpg, jpeg, gif, tif, png, bmp  |
| video         | string, stream                        | Ext: mp4                                  |
| voice         | string, stream                        | Ext: ogg                                  |
| location      | string, json                          |                                           |
| chatAction    | string                                |                                           |


## License

MIT

----------------------------------
[@ Daeren Torn][1]


[1]: http://666.io
[2]: https://core.telegram.org/bots/api
