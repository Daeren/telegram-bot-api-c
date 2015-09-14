`npm install telegram-bot-api-c`


```js
var rBot = require("telegram-bot-api-c");

//-----------------------------------------------------

var objBot =  rBot(process.env.TELEGRAM_BOT_TOKEN);

var api     = objBot.api,

    file    = __dirname + "/MiElPotato.jpg",
    data    = () => ({"chat_id": "-34042985", "text": "Date: " + Date.now()});


api.sendMessage(data(), function justCallback() {
    api.sendMessage(data())
    
        .then(data)
        .then(x => api.sendMessage(x))

        .then(data)
        .then(x => {
            x.photo = file;
            api.sendPhoto(x);
        });
});
```

[Telegram Bot API][2]

* Stream: +
* Server: +
* Promise: +
* ES6: +
* Analytics: +


#### Polling 

```js
var api = objBot.api;

api
    .setWebhook()
    .then(() => api.getUpdates())
    .then(JSON.parse)
    .then(console.log, console.error);
```


#### Analytics 

Used [Botan SDK][3]

```js
objBot
    .server(objSrvOptions, cbMsg)
    .analytics("apiKey", "appName")
    .command("start", cbCmdStart);
```


#### Server

```js
var rBot = require("telegram-bot-api-c");

//-----------------------------------------------------

var objBotFather    = rBot();
var objSrvOptions   = {
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

var objMyBot    = rBot(process.env.TG_BOT_TOKEN_MY),
    objOtherBot = rBot(process.env.TG_BOT_TOKEN_OTHER);

var objSrv = objBotFather.server(objSrvOptions);

objSrv
    .bot(objMyBot, "/MyBot") // <-- Auto-Webhook
    .analytics("apiKey", "appNameMyBot")
    
    .command("start", cbCmdStart)
    .command("stop", cbCmdStop);

objSrv
    .bot(objOtherBot, "/OtherBot", cbOtherBot)
    .analytics("apiKey", "appNameOtherBot");
    
//------------------]>

function cbOtherBot(data) {
    var msg         = data.message;

    var msgChat     = msg.chat,
        msgText     = msg.text;

    //----------------]>

    this.id = msgChat.id;

    this.api.getMe()
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

            return this.forward()
                .then(JSON.parse)
                .then(console.log, console.error);

        })
        .then(() => {
            this.data.message = ">_>";
            return this.send();
        })
        .then(JSON.parse)
        .then(console.log, console.error);
}

//--------------)>

function cbCmdStart(data, params) {
    this.id = data.message.chat.id;
    this.data.message = "cbCmdStart";
    this.send();
}

function cbCmdStop(data, params) {
    this.id = data.message.chat.id;
    this.data.message = params;
    this.send();
}
```


#### mServer

```js
var objBot = new rBot(process.env.TELEGRAM_BOT_TOKEN);

objBot.api
    .setWebhook("site.xx/myBot")
    
    .then(JSON.parse)
    .then(response => {
        if(!response.ok)
            throw new Error("Oops...problems with webhook...");

        objBot
            .server(objSrvOptions, cbMsg)
            .command("start", cbCmdStart);
    });
```


#### Instance 

| Attribute         | Type           | Note                              |
|-------------------|----------------|-----------------------------------|
|                   | -              |                                   |
| api               | Object         | See [Telegram Bot API][2]         |


| Method            | Arguments                                                             | Return                            |
|-------------------|-----------------------------------------------------------------------|-----------------------------------|
|                   | -                                                                     |                                   |
| setToken          | token                                                                 | this                              |
|                   | -                                                                     |                                   |
| call              | method, data[, callback(error, buffer, response)]                     |                                   |
| callJson          | method, data[, callback(error, json, response)]                       |                                   |
|                   | -                                                                     |                                   |
| send              | id, data[, callback(error, buffer, response)]                         | promise or undefined              |
|                   | -                                                                     |                                   |
| createServer      | [options][, callback(json, request)]                                  | ~                                 |


#### Methods: send

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

#### Methods: server

| Name          | Arguments                             | Note                                      |
|---------------|---------------------------------------|-------------------------------------------|
|               | -                                     |                                           |
| bot           | bot, path, callback(json, request)    |                                           |
| analytics     | apiKey[, appName="Telegram Bot"]      |                                           |
| command       | cmd, callback(data, params, request)  |                                           |


## License

MIT

----------------------------------
[@ Daeren Torn][1]


[1]: http://666.io
[2]: https://core.telegram.org/bots/api
[3]: https://github.com/botanio/sdk#js