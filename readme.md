```
npm install telegram-bot-api-c
git clone https://github.com/Daeren/telegram-bot-api-c.git
```

#### OneShot (Server:LongPolling)

```js
require("telegram-bot-api-c")("TOKEN").polling(function(x) {this.data.message = x; this.send();});
```

#### Send some stuff

```js
var rBot    = require("telegram-bot-api-c");
var objApi  = rBot(process.env.TELEGRAM_BOT_TOKEN).api;

var file    = __dirname + "/MiElPotato.jpg",
    data    = () => ({"chat_id": 0, "text": Date.now(), "parse_mode": "markdown"});

objApi.sendMessage(data(), function() {
    objApi
        .sendMessage(data())
        
        .then(data)
        .then(x => api.sendMessage(x))

        .then(data)
        .then(x => {
            x.photo = file;
            api.sendPhoto(x);
        });
});
```

[Telegram Bot API][3]

* Stream: +
* Server: +
* LongPolling: +
* Analytics: +
* Promise: +
* ES6: +
* BotCommands: /start [text], /start@bot [text], @bot /start [text]


#### Polling 

```js
var objSrv;

var objBot      = rBot(process.env.TELEGRAM_BOT_TOKEN);
var objOptions  = {
    "limit":    100,
    "timeout":  0,
    "interval": 5 // <-- Sec.
};

objBot.api
    .setWebhook()
    .then(x => {
        objSrv = objBot
            .polling(objOptions, cbMsg)
            .analytics("apiKey", "appName")
            .command("stop", cbCmdStop);
    });

function cbMsg(data) {
    this.data.message = data;
    this.send();
}

function cbCmdStop(data, params) {
    this.data.message = "cbCmdStop";
    this.send();

    objSrv.stop();
}
```


#### Analytics 

Used [Botan SDK][4]

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
    // For Self-signed certificate, you need to upload your public key certificate
    // "selfSigned":  "fullPath/stream/string-key",

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

    // this.id = msgChat.id; <-- Default: chat_id in message

    this.api
        .getMe()
        .then(() => {
            this.data.chatAction = "typing";
            return this.send();
        })
        .then(() => {
            // this.mid = msg.message_id; <-- Default: message_id in message
            // this.from = msgChat.id; <-- Default: chat_id in message
            
            this.to = msg.text;
            return this.forward();
        })
        .then(() => {
            this.data.message = "Use: /start;
            return this.send();
        })
        .then(JSON.parse)
        .then(console.log, console.error);
}

//--------------)>

function cbCmdStart(data, params) {
    this.data.message = "Cmd: " + params.name + params.text;
    this.send();
}

function cbCmdStop(data, params) {
    this.data = [
        {"message": params},
        {"photo": __dirname + "/MiElPotato.jpg", "caption": "#2EASY"}
    ];

    this.send();
}
```


#### mServer

```js
var objBot = rBot(process.env.TELEGRAM_BOT_TOKEN);

objBot.api
    .setWebhook({"url": "site.xx/myBot"})
    .then(JSON.parse)
    .then(response => {
        if(!response.ok)
            throw new Error("Oops...problems with webhook...");

        objBot
            .server(objSrvOptions, cbMsg)
            .command("start", cbCmdStart);
    }, console.error);
```


#### Instance 

| Attribute         | Type           | Note                              |
|-------------------|----------------|-----------------------------------|
|                   | -              |                                   |
| api               | Object         | See [Telegram Bot API][3]         |


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
| server            | [options][, callback(json, request)]                                  | ~                                 |
| polling           | [options][, callback(json)]                                           | ~                                 |
|                   | -                                                                     |                                   |
| parseCmd          | text                                                                  | object {name, text, cmd}          |


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

#### Methods: polling

| Name          | Arguments                             | Note                                      |
|---------------|---------------------------------------|-------------------------------------------|
|               | -                                     |                                           |
| stop          |                                       |                                           |
|               | -                                     |                                           |
| analytics     | apiKey[, appName="Telegram Bot"]      |                                           |
| command       | cmd, callback(data, params)           |                                           |

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
[@ Telegram][2]


[1]: http://666.io
[2]: https://telegram.me/io666
[3]: https://core.telegram.org/bots/api
[4]: https://github.com/botanio/sdk#js