```
npm install telegram-bot-api-c
git clone https://github.com/Daeren/telegram-bot-api-c.git
```

#### OneShot

```js
require("telegram-bot-api-c")("TOKEN").polling(x => {x.data.text = "Hi"; x.send();});
```

```js
require("telegram-bot-api-c")("TOKEN").api.sendMessage({"text": "Hi", "chat_id": 0});
```

```js
var rBot    = require("telegram-bot-api-c");
var objBot  = rBot(process.env.TELEGRAM_BOT_TOKEN);

//--------]>

var srv = objBot.polling(rspNotFound);

//----)>

srv
    .on("/start", rspCmdStart)
    .on("/", rspCmdNotFound)

    .on("text", rspText)
    .on(["photo", "document"], rspPhotoOrDoc)
    
    .on(/^id\s+(\d+)/i, rspTextRegExp)
    .off(/^id\s+(\d+)/i, rspTextRegExp);

//----)>

function rspNotFound(bot, cmdParams) { }
function rspCmdNotFound(bot, cmdParams) { }

function rspTextRegExp(bot, reParams) {}

function rspText(bot) {}
function rspPhotoOrDoc(bot) { }

//--------]>

var api     = objBot.api,
    buttons = objBot.keyboard;

var data;

//----)>

data = [
    {"text": params},
    {"photo": __dirname + "/MiElPotato.jpg", "caption": "#2EASY"}
];

rBot.send("chatId", data);

//----)>

data = () => ({"chat_id": 0, "text": Date.now(), "parse_mode": "markdown"});

api.sendMessage(data(), function() { });
api.sendMessage(data()).then(data).then(x => {
    x.photo = file;
    x.reply_markup = buttons.hOxOnce;

    api.sendPhoto(x);
});
```

[Telegram Bot API][3]

* Stream: +
* Server: +
* LongPolling: +
* Analytics: +
* Promise: +
* BotCommands: /start [text], /start@bot [text], @bot /start [text]
* LoadFileByUrl: photo, audio, document, sticker, voice


#### Download

```js
objBot.download("file_id", "dir");
objBot.download("file_id", "dir", "name.mp3");


objBot
    .download("file_id")
    .then(info => {
        info.stream.pipe(require("fs").createWriteStream("O:/" + info.name));
    });


objBot
    .download("file_id", function(error, info) {
        info.stream.pipe(require("fs").createWriteStream("O:/t.x"));
    });
```


#### Polling

```js
var objSrv;

var objBot      = rBot(process.env.TELEGRAM_BOT_TOKEN);
var objOptions  = {
    "limit":    100,
    "timeout":  0,
    "interval": 2 // <-- Default / Sec.
};

objSrv = objBot
    .polling(objOptions, cbMsg)
    .on("/stop", cbCmdStop);

function cbMsg(bot) {
    bot.data.text = "Stop me: /stop";
    bot.send();
}

function cbCmdStop(bot, params) {
    bot.data.text = params;
    bot.send();

    objSrv.stop();
}
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

var objSrv      = objBotFather.server(objSrvOptions);

objSrv
    .bot(objMyBot, "/MyBot") // <-- Auto-Webhook
    .on("/start", cbCmdStart)
    .on("/stop", cbCmdStop);

objSrv
    .bot(objOtherBot, "/OtherBot", cbOtherBot);
    
//------------------]>

function cbOtherBot(bot) {
    // bot.cid = bot.message.chat.id; <-- Default

    bot
        .api
        .getMe()

        .then(() => {
            bot.data.chatAction = "typing";
            return bot.send();
        })
        .then(() => {
            // bot.mid = bot.message.message_id; <-- Default
            // bot.from = bot.message.chat.id; <-- Default
            
            bot.to = bot.message.text;
            return bot.forward();
        })
        .then(() => {
            bot.data.text = "Use: /start";
            return bot.send();
        })
        .then(JSON.parse)
        .then(console.log, console.error);
}

//--------------)>

function cbCmdStart(bot, params) {
    bot.data = [
        {"chatAction": "typing"},
        {"text": params.name + " " + params.text},
        {
            "photo":        "https://www.google.ru/images/logos/ps_logo2.png",
            "maxSize":      26189, // <-- decimal number of OCTETs
            "reply_markup": bot.keyboard.hOxOnce
        }
    ];

    bot.send();
}

function cbCmdStop(bot, params) {
    bot.data = [
        {"text": params},
        {"photo": __dirname + "/MiElPotato.jpg", "caption": "#2EASY"}
    ];

    bot.send();
}
```


#### mServer

```js
var objBot = rBot(process.env.TELEGRAM_BOT_TOKEN);

objBot
    .api
    .setWebhook({"url": "site.xx/myBot"})
    
    .then(JSON.parse)
    .then(response => {
        if(!response.ok)
            throw new Error("Oops...problems with webhook...");

        objBot.server(objSrvOptions, cbMsg);
    });
```


#### Analytics 

Used [Botan SDK][4]

```js
objBot
    .polling(objSrvOptions, cbMsg)
    .analytics("apiKey", "appName");
    
objBot
    .server(objSrvOptions, cbMsg)
    .analytics("apiKey", "appName");

objBot
    .server(objOptions)
    .bot(objMyBot, "/MyBot", cbMyBot)
    .analytics("apiKey", "appName");
```


#### Logger 

```js
objBot
    .polling(objOptions, cbMsg)
    .logger(cbLogger);
    
objBot
    .server(objOptions, cbMsg)
    .logger(cbLogger);
    
objBot
    .server(objOptions)
    .bot(objMyBot, "/MyBot")
    .logger(cbLogger);
    
```


#### Keyboard 

```js
var rBot = require("telegram-bot-api-c");

rBot.keyboard.numpadOnce;

function cbMsg(bot) {
    bot.data.text = "Hell Word!";
    bot.data.reply_markup = bot.keyboard.hOx;
    
    bot.send();
}

// v - vertically; h - horizontally; Once - one_time_keyboard

// vOx, hOx, vPn, hPn, vLr, hLr, vGb, hGb
// numpad, hide

// vOxOnce, hOxOnce, vPnOnce, hPnOnce, vLrOnce, hLrOnce, vGbOnce, hGbOnce
// numpadOnce
```

| Name              | Note                                 |
|-------------------|--------------------------------------|
|                   | -                                    |
| _Ox               | O / X                                |
| _Pn               | + / -                                |
| _Ud               | Upwards / Downwards arrow            |
| _Lr               | Leftwards / Rightwards arrow         |
| _Gb               | Like / Dislike                       |
|                   | -                                    |
| numpad            | 0-9                                  |
|                   | -                                    |
| hide              |                                      |



#### Module 

| Attribute         | Type           | Note                                 |
|-------------------|----------------|--------------------------------------|
|                   | -              |                                      |
| parseCmd          | text           | object {name, text, cmd}             |


#### Instance 

| Attribute         | Type           | Note                                 |
|-------------------|----------------|--------------------------------------|
|                   | -              |                                      |
| api               | Object         | See [Telegram Bot API][3]            |
| keyboard          | Object         |                                      |


| Method            | Arguments                                                             | Return                            |
|-------------------|-----------------------------------------------------------------------|-----------------------------------|
|                   | -                                                                     |                                   |
| setToken          | token                                                                 | this                              |
|                   | -                                                                     |                                   |
| call              | method, data[, callback(error, buffer, response)]                     |                                   |
| callJson          | method, data[, callback(error, json, response)]                       |                                   |
|                   | -                                                                     |                                   |
| send              | id, data[, callback(error, buffer, response)]                         | promise or undefined              |
| download          | fid[, dir][, name][, callback(error, info {id,size,file,stream})]     | promise or undefined              |
|                   | -                                                                     |                                   |
| server            | [options][, callback(json, request)]                                  | ~                                 |
| polling           | [options][, callback(json)]                                           | ~                                 |
|                   | -                                                                     |                                   |
| parseCmd          | text                                                                  | object {name, text, cmd}          |


#### Methods: send

| Name          | Type                                  | Note                                      |
|---------------|---------------------------------------|-------------------------------------------|
|               | -                                     |                                           |
| text          | string, json                          |                                           |
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
| logger        | callback(error, buffer)               |                                           |
| analytics     | apiKey[, appName="Telegram Bot"]      |                                           |
| on            | type, callback(data, params)          |                                           |
| off           | type, callback                        |                                           |

#### Methods: server

| Name          | Arguments                             | Note                                      |
|---------------|---------------------------------------|-------------------------------------------|
|               | -                                     |                                           |
| bot           | bot, path, callback(json, request)    |                                           |
| logger        | callback(error, buffer)               |                                           |
| analytics     | apiKey[, appName="Telegram Bot"]      |                                           |
| on            | type, callback(data, params)          |                                           |
| off           | type, callback                        |                                           |


## License

MIT

----------------------------------
[@ Daeren Torn][1]
[@ Telegram][2]


[1]: http://666.io
[2]: https://telegram.me/io666
[3]: https://core.telegram.org/bots/api
[4]: https://github.com/botanio/sdk#js