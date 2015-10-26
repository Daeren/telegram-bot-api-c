```
npm -g install telegram-bot-api-c
git clone https://github.com/Daeren/telegram-bot-api-c.git
```

#### OneShot

```js
require("telegram-bot-api-c")("TOKEN").polling(x => {x.data.text = "Hi"; x.send();});
```

```js
require("telegram-bot-api-c")("TOKEN").api.sendMessage({"chat_id": 0, "text": "Hi"});
```

```js
> tg-api TOKEN sendMessage --chat_id=0 --text="Hi"
```

[Telegram Bot API][3]

* Stream: +
* Promise: +
* BotCommands: /start [text], /start@bot [text], @bot /start [text], @bot [text]
* LoadFileByUrl: photo, audio, document, sticker, voice
* Redirect: +


#### Index

* [Start](#refStart)
* [CLI](#refCLI)
* [Download](#refDownload)
* [Polling](#refPolling)
* [Server](#refServer)
* [mServer](#refMServer)
* [Nginx+Node.js](#refExampleNginxNodejs)
* [Analytics](#refAnalytics)
* [Middleware](#refMiddleware)
* [Logger](#refLogger)
* [Keyboard](#refKeyboard)
* [Errors](#refErrors)



<a name="refStart"></a>
#### Start

```js
var rBot    = require("telegram-bot-api-c");
var objBot  = rBot(process.env.TELEGRAM_BOT_TOKEN);

//----[Server]----}>

var srv = objBot
    .polling(onNotFound)
    .use(function(type, bot, next) { next(); });

//----)>

srv
    .on("/start", onCmdStart)
    .on("/", onCmdNotFound)

    .on("enterChat", onEnterChat)
    .on("text", onText)
    .on("photo document", onPhotoOrDoc)

    .on(/^(id)\s+(\d+)/i, "type id", onTextRegExp)
    .on(/^(login)\s+(\w+)/i, ["type", "login"], onTextRegExp)

    .on(/^id\s+(\d+)/i, onTextRegExp)
    .off(/^id\s+(\d+)/i, onTextRegExp);

//----)>

function onNotFound(bot, cmd) { }
function onCmdNotFound(bot, params) { }

function onCmdStart(bot, params) { }
function onTextRegExp(bot, params) { }

function onEnterChat(bot, data) { }
function onText(bot, data) { }
function onPhotoOrDoc(bot, data) { }

//----[API]----}>

var api     = objBot.api,
    buttons = objBot.keyboard;

var data;

//----)>

data = [
    {"text": ["H", "i"]},
    {"photo": __dirname + "/MiElPotato.jpg", "caption": "#2EASY"}
];

objBot.send("chatId", data);

//----)>

data = () => ({"chat_id": 0, "text": Date.now(), "parse_mode": "markdown"});

api.sendMessage(data(), function() { });
api.sendMessage(data()).then(data).then(function(x) {
    x.photo = file;
    x.reply_markup = buttons.hOxOnce;
    x.reply_markup = buttons("X Y Z");
    x.reply_markup = buttons([["X"]], "resize once selective");

    api.sendPhoto(x);
});
```



<a name="refCLI"></a>
#### CLI

```js
> tg-api TOKEN METHOD -bool --key=val
> node telegram-bot-api-c TOKEN METHOD -bool --key=val

...

> tg-api X sendMessage --chat_id=0 --text="Hi" -disable_web_page_preview

> tg-api X sendPhoto --chat_id=0 --photo="/path/MiElPotato.jpg"
> tg-api X sendPhoto --chat_id=0 --photo="https://www.google.ru/images/logos/ps_logo2.png"

> tg-api X sendMessage < "./test/msg.json"

...

> tg-api X sendMessage
> {"chat_id": 0, "t
> ext": "Hi"}
> <enter> [\r\n]

(result)

> {"chat_id": 1, "text": "Hi 2"}
> <enter> [\r\n]

(result)
```



<a name="refDownload"></a>
#### Download

```js
objBot.download("file_id", "dir");
objBot.download("file_id", "dir", "name.mp3");


objBot
    .download("file_id")
    .then(function(info) {
        info.stream.pipe(require("fs").createWriteStream("O:/" + info.name));
    });


objBot
    .download("file_id", function(error, info) {
        info.stream.pipe(require("fs").createWriteStream("O:/t.x"));
    });
```



<a name="refPolling"></a>
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



<a name="refServer"></a>
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
            bot.data.text = "Forward: ok";
            return bot.send();
        })
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
}
```



<a name="refMServer"></a>
#### mServer

```js
var objBot = rBot(process.env.TELEGRAM_BOT_TOKEN);

objBot
    .api
    .setWebhook({"url": "site.xx/myBot"})
    .then(isOk => {
        if(!isOk)
            throw new Error("Oops...problems with webhook...");

        objBot.server(objSrvOptions, cbMsg);
    });
```



<a name="refExampleNginxNodejs"></a>
#### NGINX + Node.js

```js
var objBot          = rBot();
var objSrvOptions   = {
    "http":         true,

    "autoWebhook":  "site.xx:88", // <-- Default: (host + port); `false` - disable

    "host":         "localhost",
    "port":         1490
};

objBot.server(objSrvOptions, cbMsg);
```



<a name="refAnalytics"></a>
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



<a name="refLogger"></a>
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



<a name="refMiddleware"></a>
#### Middleware 

```js
objSrv
    .use(function(type, bot, next) {
        console.log("1 | Type: %s", type);

        if(bot.message.text === "next")
            next();
    })
    .use(function(type, bot, next) {
        console.log("2 | Type: %s", type);

        bot.user = {};

        next();
    });

objSrv
    .on("text", function(bot, data) {
        bot.user.id;
    });
```



<a name="refKeyboard"></a>
#### Keyboard 

```js
var rBot = require("telegram-bot-api-c");

rBot.keyboard.numpadOnce;

function cbMsg(bot) {
    bot.data.text = "Hell Word!";
    bot.data.reply_markup = bot.keyboard.hOx;
    
    bot.send();
}

// rBot.keyboard(buttons[, params])
// buttons: string or array
// params: "resize once selective"

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



<a name="refErrors"></a>
#### Errors 

```js
var rBot    = require("telegram-bot-api-c");
var gBot    = rBot(process.env.TELEGRAM_BOT_TOKEN);

var api     = gBot.api;

//------------]>

api
    .sendMessage({"chat_id": "0"})
    .then(console.info, console.error);
    
api.sendMessage({"chat_id": "0", "text":"Hi"}, (e, data) => console.log(e || data));

// e    - Error: request/JSON.parse/response.ok
// data - JSON: response.result or null

//------------]>

gBot.call("sendMessage", {"chat_id": "0"}, (e, data) => console.log(e || data));

// e    - Error: request
// data - Buffer: response

//------------]>

gBot.callJson("sendMessage", {"chat_id": "0"}, (e, data) => console.log(e || data));

// e    - Error: request/JSON.parse
// data - JSON: response or null
```



#### Module 

| Attribute         | Type           | Note                                 |
|-------------------|----------------|--------------------------------------|
|                   | -              |                                      |
| keyboard          | function       | return: object                       |
| parseCmd          | text           | object {name, text, cmd}             |


#### Instance 

| Attribute         | Type           | Note                                 |
|-------------------|----------------|--------------------------------------|
|                   | -              |                                      |
| api               | Object         | See [Telegram Bot API][3]            |
| keyboard          | function       | return: object                       |


| Method            | Arguments                                                             | Return                            |
|-------------------|-----------------------------------------------------------------------|-----------------------------------|
|                   | -                                                                     |                                   |
| setToken          | token                                                                 | this                              |
|                   | -                                                                     |                                   |
| call              | method, data[, callback(error, buffer, response)]                     |                                   |
| callJson          | method, data[, callback(error, json, response)]                       |                                   |
|                   | -                                                                     |                                   |
| send              | id, data[, callback(error, json, response)]                           | promise or undefined              |
| download          | fid[, dir][, name][, callback(error, info {id,size,file,stream})]     | promise or undefined              |
|                   | -                                                                     |                                   |
| server            | [options][, callback(bot, cmd)]                                       | object                            |
| polling           | [options][, callback(bot, cmd)]                                       | object                            |
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

| Name          | Arguments                             | Return                                    |
|---------------|---------------------------------------|-------------------------------------------|
|               | -                                     |                                           |
| start         |                                       | this                                      |
| stop          |                                       | this                                      |
|               | -                                     |                                           |
| logger        | callback(error, buffer)               | this                                      |
| analytics     | apiKey[, appName="Telegram Bot"]      | this                                      |
| use           | callback(type, bot, next)             | this                                      |
| on            | type[, params], callback(data, params)| this                                      |
| off           | [type][, callback]                    | this                                      |

#### Methods: server

| Name          | Arguments                             | Return                                    |
|---------------|---------------------------------------|-------------------------------------------|
|               | -                                     |                                           |
| bot           | bot, path, callback(json, request)    | a new instance                            |
|               | -                                     |                                           |
| logger        | callback(error, buffer)               | this                                      |
| analytics     | apiKey[, appName="Telegram Bot"]      | this                                      |
| use           | callback(type, bot, next)             | this                                      |
| on            | type[, params], callback(data, params)| this                                      |
| off           | [type][, callback]                    | this                                      |


#### Events: on

| Name              | Args                                  | Note                                      |
|-------------------|---------------------------------------|-------------------------------------------|
|                   | -                                     |                                           |
| enterChat         | bot, data                             |                                           |
| leftChat          | bot, data                             |                                           |
|                   | -                                     |                                           |
| chatTitle         | bot, data                             |                                           |
| chatNewPhoto      | bot, data                             |                                           |
| chatDeletePhoto   | bot, data                             |                                           |
| chatCreated       | bot, data                             |                                           |
|                   | -                                     |                                           |
| text              | bot, data                             |                                           |
| photo             | bot, data                             |                                           |
| audio             | bot, data                             |                                           |
| document          | bot, data                             |                                           |
| sticker           | bot, data                             |                                           |
| video             | bot, data                             |                                           |
| voice             | bot, data                             |                                           |
| contact           | bot, data                             |                                           |
| location          | bot, data                             |                                           |
|                   | -                                     |                                           |
| /[name]           | data, params                          | CMD                                       |
|                   | -                                     |                                           |
| [regexp]          | data, params                          |                                           |


## License

MIT

----------------------------------
[@ Daeren][1]
[@ Telegram][2]


[1]: http://666.io
[2]: https://telegram.me/io666
[3]: https://core.telegram.org/bots/api
[4]: https://github.com/botanio/sdk#js