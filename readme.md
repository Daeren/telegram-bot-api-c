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
    .then(data => send(id, [{"chatAction": "upload_photo"}, {"message": ""}, {"message": data}]))
    
    .then(results => {
        for(var name in results)
            console.log("Name: %s\n%s\n\n", name, results[name].toString());
    })
    
    .then(() => send(id, {"photo": require("fs").createReadStream(file)}))
    .then(() => send(id, {"photo": file}))
    .then(JSON.parse)
    .then(data => send(id, {"photo": data.result.photo[0].file_id, "caption": "Hell World!"}));

//-----------------------------]>

var data = {
    "chat_id":  id,
    "action":   "typing"
};

objBot.call("sendChatAction", data);
```


#### Polling 

```js
objBot
    .webhook()
    .then(() => objBot.polling())
    .then(JSON.parse)
    .then(console.log, console.error);

```


#### Server (RC 4)

```js
var rBot = require("telegram-bot-api-c");

//-----------------------------------------------------

var objBotServer    = new rBot(process.env.TG_BOT_TOKEN_COMMON_CAN_EMPTY);
var gBotSrvOptions  = {
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

var objMyBot    = new rBot(process.env.TG_BOT_TOKEN_MY),
    objOtherBot = new rBot(process.env.TG_BOT_TOKEN_OTHER);

var objSrv = objBotServer.createServer(gBotSrvOptions, cbCommonMsg);

objSrv
    .bot(objMyBot, "/MyBot", cbMyBot) // <-- Auto-Webhook
    .command("feedback", cbCmdFeedback);

objSrv
    .bot(objOtherBot, "/OtherBot", cbOtherBot)
    .command("feedback", cbCmdFeedback);

//------------------]>

function cbCommonMsg(data) {
    this.id = data.message.chat.id;
    this.data.message = "cbCommonMsg";
    this.send();
}

//---------)>

function cbMyBot(data) {
    var msg         = data.message;

    var msgChat     = msg.chat,
        msgText     = msg.text;

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
        })
        .then(() => {
            this.data.photo = __dirname + "/MiElPotato.jpg";
            return this.send();
        })
        .then(() => {
            this.mid = msg.message_id;
            this.from = msgChat.id;
            this.to = msgText;

            return this.forward();

        })
        .then(() => {
            this.data.message = ">_>";
            return this.send();
        })
        .then(JSON.parse)
        .then(console.log, console.error);
}

//---------)>

function cbOtherBot(data) {
    this.id = data.message.chat.id;
    this.data.message = "cbOtherBot";
    this.send();
}

//--------------)>

function cbCmdFeedback(data, params) {
    this.id = data.message.chat.id;
    this.data.message = params;
    this.send();
}
```


#### mServer

```js
var objBotServer = new rBot(process.env.TELEGRAM_BOT_TOKEN);

objBotServer
    .webhook("site.xx/myBot")

    .then(JSON.parse)
    .then(response => {
        if(!response.ok)
            throw new Error("Oops...problems with webhook...");

        objBotServer
            .createServer(gBotSrvOptions, cbCommonMsg)
            .command("feedback", cbCmdFeedback);
    });
```


[Telegram Bot API][2]


| Method          | Arguments                                                           | Return                            |
|-----------------|---------------------------------------------------------------------|-----------------------------------|
|                 | -                                                                   |                                   |
| call            | method, data[, callback(error, buffer, response)*1]                 |                                   |
| callJson        | method, data[, callback(error, json, response)]                     |                                   |
|                 | -                                                                   |                                   |
| forward         | mid, chatFrom, chatTo, [, callback*1]                               | promise or undefined              |
| send            | id, data[, callback*1]                                              | promise or undefined              |
| i               | [callback*1]                                                        | promise or undefined              |
|                 | -                                                                   |                                   |
| profilePhotos   | uid[, offset][, limit][, callback*1]                                | promise or undefined              |
|                 | -                                                                   |                                   |
| webhook         | url, cert[, callback*1]                                             | promise or undefined              |
| polling         | [offset][, limit][, timeout][, callback*1]                          | promise or undefined              |
|                 | -                                                                   |                                   |
| setToken        | token                                                               | this                              |
|                 | -                                                                   |                                   |
| createServer    | options, callback(json, request)                                    | new instance of https.Server      |


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