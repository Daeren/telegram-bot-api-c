[![Codacy][cod_b]][cod_l]

```
npm -g install telegram-bot-api-c
git clone https://github.com/Daeren/telegram-bot-api-c.git
```


```js
require("telegram-bot-api-c").call("TOKEN", "sendMessage", [0, "+"])
```

```js
require("telegram-bot-api-c")("TOKEN").api.sendMessage({chat_id: 0, text: "+"})
```

```js
require("telegram-bot-api-c")("TOKEN").polling(bot => bot.answer().html("+").send())
```

```js
> tg-api TOKEN sendMessage --chat_id=0 --text="+"
```


[Telegram Bot API][3], [Bot API 2.0][100], Bot API 2.1, Bot API 2.2 ([Telegram Gaming Platform][5]), Bot API 2.3, Bot API 2.3.1

* Proxy: +
* Array and [Map][10] as a data source (.call, .callJson, .api[method]): +
* Analytics: [tgb-pl-botanio][4]
* Added: tgBot.api[sendMethod] => error.retryAfter
* Added: "channelPost" and "editedChannelPost"
* Added: "force" and "disable_edit_message" (setGameScore)
* Added: example "channelPost"
* Added: [tgUrlUpload](#refTgUpload)




```
- All methods in the Bot API are case-insensitive (method: .call, .callJson)

- message:                                  buffer, stream, string
- location|venue|contact:                   buffer, string
- photo|audio|voice|video|document|sticker: buffer, stream, file_id, path, url
- certificate:                              buffer, stream, path, url
```


#### Goals:
1. High stability;
2. Low memory usage;
3. Maximum performance;
4. Flexibility.


#### Index

* [Start](#refStart)
* [Proxy](#refProxy)
* [Polling](#refPolling)
* [HTTP](#refHTTP)
* [Virtual](#refVirtual)
* [mServer](#refMServer)
* [Nginx + Node.js](#refExampleNginxNodejs)
* [Response Builder](#refResponseBuilder)
* [Tg Upload](#refTgUpload)
* [Plugin](#refPlugin)
* [Goto](#refGoto)
* [JS Generators](#refJSGenerators)
* [Render](#refRender)
* [Keyboard](#refKeyboard)
* [Download](#refDownload)
* [InlineQuery](#refInlineQuery)
* [Send file as Buffer](#refSendFileAsBuffer)
* [CLI](#refCLI)
* [Test](#refTest)



![architecture][image-architecture]



<a name="refStart"></a>

```js
const rTgBot    = require("telegram-bot-api-c");

const gBot      = rTgBot(process.env.TELEGRAM_BOT_TOKEN),
      gApi      = gBot.api;

//----------------------------]>

gBot.promise(require("bluebird"));

//----------------------------]>

gApi
    .sendMessage(["0", "Hi"])
    .then(console.info, console.error);
    
gApi.sendMessage(["0", "Hi"], (e, data) => console.log(e || data));

// e    - Error: request/JSON.parse/response.ok
// data - JSON: response.result or null

//-------]>

gBot.callJson("sendMessage", ["0", "Hi"], (e, data, res) => console.log(e || data));

// e    - Error: request/JSON.parse
// data - JSON: response or null
// res  - Class: http.IncomingMessage or null

//-------]>

gBot.call("sendMessage", ["0", "Hi"], (e, data, res) => console.log(e || data));

// e    - Error: request
// data - Buffer: response or null
// res  - Class: http.IncomingMessage or null

//------------]>

/*
  e.code           - gApi.sendMessage( ...
  data.error_code  - callJson("sendMessage" ...

  rTgBot or gBot

  gBot.ERR_INTERNAL_SERVER
  gBot.ERR_NOT_FOUND
  gBot.ERR_FORBIDDEN
  gBot.ERR_MESSAGE_LIMITS
  gBot.ERR_USED_WEBHOOK
  gBot.ERR_INVALID_TOKEN

  gBot.ERR_BAD_REQUEST
  gBot.ERR_BAD_PROXY
  gBot.ERR_FAILED_PARSE_DATA
*/

//----------------------------]>

gBot
    .polling(onDefault)
    .catch(onError)
    
    .use(bot => "syncGotoMyMenu")
    .use((bot, data, next) => next(new Error("never get")))
    .use("/start", bot => { })

    .on("/start", onCmdStart_1)
    .on("/start", onCmdStart_2)
    .on("/start", onCmdStart_3)

    .on("enterChat", onEnterChat)
    .on("text:syncGotoMyMenu", onText)
    .on("photo document", onPhotoOrDoc)
    .on("pinnedMessage", onPinnedMessage)

    .on(/^id\s+(\d+)/i, onTextRegEx)
    .on(/^(id)\s+(\d+)/i, "type id", onTextRegEx)
    .on(/^(login)\s+(\w+)/i, ["type", "login"], onTextRegEx);


function onDefault(bot) { }
function onError(error) { }

function onCmdStart_1(bot, params, next) { next(); } // <-- Async
function onCmdStart_2(bot, params) { }               // <-- Sync
function onCmdStart_3(bot, params) { }               // <-- Sync | end

function onEnterChat(bot, member) { }
function onText(bot, text) { }
function onPhotoOrDoc(bot, data) { }
function onPinnedMessage(bot, message) { }

function onTextRegEx(bot, data) { }

//-----------]>

/*
  bot                               | gBot -> Sugar -> CtxPerRequest
  bot instanceof gBot.constructor   | true
  
  bot.command.type                  | common or private
  
  /start [text]         -> common
  /start@bot [text]     -> private
  @bot /start [text]    -> private
*/
```



<a name="refProxy"></a>
#### Proxy

```js
const gBot      = rBot(process.env.TELEGRAM_BOT_TOKEN);

const gProxyStr = "127.0.0.1:1337", // <-- Only HTTPS
      gProxyObj = {
          "host": "127.0.0.1",
          "port": 1337
      };

//------------------]>

function getMe(callback) { gBot.api.getMe(callback); }

//------------------]>

gBot.proxy(gProxyObj);

getMe(t => {
    objBot.proxy(gProxyStr);

    getMe(t => {
        objBot.proxy(); // <-- Remove
        getMe();
    });
});

rBot.callJson({
    "token":    process.env.TELEGRAM_BOT_TOKEN,
    "method":   "getMe",
    "proxy":    gProxyStr
}, (e, d) => {});

rBot.callJson(process.env.TELEGRAM_BOT_TOKEN, "getMe", (e, d) => {}, gProxyObj);
```



<a name="refPolling"></a>
#### Polling

```js
const gBot      = rBot(process.env.TELEGRAM_BOT_TOKEN);

const gOptions  = {
    "limit":    100,
    "timeout":  0,
    "interval": 2 // <-- Default / Sec.
};

//------------------]>

const gSrv = gBot
    .polling(gOptions, onMsg)
    .on("/stop", onCmdStop);
    
//------------------]>

function onMsg(bot) {
    const msg = bot.isGroup && bot.isReply ? ">_>" : "Stop me: /stop";
    bot.answer().isReply().text(msg).send();
}

function onCmdStop(bot, params) {
    gSrv.stop();
    bot.answer().text(JSON.stringify(params)).send();
}
```



<a name="refHTTP"></a>
#### HTTP

```js
const rBot = require("telegram-bot-api-c");

//-----------------------------------------------------

const gSrvOptions   = {
    // For Self-signed certificate, you need to upload your public key certificate
    // "selfSigned":  "fullPath/stream/buffer",  // <-- If you use Auto-Webhook

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

const gBotFather    = rBot();

const gMyBot        = rBot(process.env.TG_BOT_TOKEN_MY),
      gOtherBot     = rBot(process.env.TG_BOT_TOKEN_OTHER);

const gSrv          = gBotFather.http(gSrvOptions);

gSrv
    .bot(gMyBot)                                    // <-- Auto-Webhook: "/tg_bot_<sha256(token)>"
    .on("/start", onCmdStart)
    .on("/stop", onCmdStop);

gSrv
    .bot(gOtherBot, "/urlOtherBot", onMsgOtherBot); // <-- Auto-Webhook
    
//------------------]>

function onMsgOtherBot(bot) { }

function onCmdStart(bot, params) { }
function onCmdStop(bot, params) { }
```



<a name="refVirtual"></a>
#### Virtual

```js
const gBot = rBot(process.env.TELEGRAM_BOT_TOKEN);

const gSrv = gBot
    .virtual(function(bot) {
        bot.answer().text("Not found!").send();
    })
    .on("photo", console.log);

//----[Proxy: express]----}>

gBot
    .api
    .setWebhook({"url": "https://site.xx/dev-bot"})
    .then(function(isOk) {
        const rExpress      = require("express"),
              rBodyParser   = require("body-parser");

        rExpress()
            .use(rBodyParser.json())
            .post("/dev-bot", gSrv.middleware)
            .listen(3000, "localhost");
    });
    
//----[Stress Tests]----}>

gSrv.input(null, {
    "update_id": 0,
    "message": {
        "message_id": 0,

        "from": {
            "id": 0,
            "first_name": "D",
            "username": ""
        },

        "chat": {
            "id": 0,
            "first_name": "D",
            "username": "",
            "type": "private"
        },

        "date": 0,
        "text": "Hello"
    }
});
```



<a name="refMServer"></a>
#### mServer

```js
const gBot = rBot(process.env.TELEGRAM_BOT_TOKEN);

gBot
    .api
    .setWebhook({"url": "https://site.xx/myBot"})
    .then(function(isOk) {
        if(!isOk)
            throw new Error("Oops...problem with the webhook...");

        gBot.http(objSrvOptions, cbMsg);
    });
```



<a name="refExampleNginxNodejs"></a>
#### NGINX + Node.js

```js
const gBot          = rBot();
const gSrvOptions   = {
    "ssl":          false,

    "autoWebhook":  "site.xx:88", // <-- Default: (host + port); `false` - disable

    "host":         "localhost",
    "port":         1490
};

gBot.http(gSrvOptions, onMsg);

//----[DEFAULT]----}>

gBot.http();
gBot.http(onMsg);

// host: localhost
// port: 1488
// autoWebhook: false
// ssl: false
```



<a name="refResponseBuilder"></a>
#### Response Builder
```js
objSrv
    .use(function(bot) {
        bot
            .answer() // <-- Builder + Queue

            .chatAction("typing") // <-- Element

            .text("https://google.com", "markdown") // <-- Element
            //.parseMode("markdown")
            .disableWebPagePreview() // <-- Modifier (for the last element)
            .keyboard([["X"], ["Y"]]) // <-- Modifier
            
            .markdown("*text*") // <-- Element
            .html("<a>text</a>")

            .chatAction("upload_photo")
            
            .photo("https://www.google.ru/images/logos/ps_logo2.png", "myCaption")
            .caption("#2EASY") // <-- Modifier
            .keyboard("old")
            .keyboard("new", "selective") // <-- Uses: bot.mid (selective)

            .location(69, 96)
            .latitude(13)
            .keyboard() // <-- Hide

            .send() // <-- Uses: bot.cid

            .then(console.log);  // <-- Return: array | results
        
        //------[ONE ELEMENT]------}>
        
        const customKb = {
            "keyboard":         [["1"], ["2"], ["3"]],
            "resize_keyboard":  true
        };

        bot
            .answer()
            .text("Hi")
            .keyboard(customKb)
            .send((e, r) => console.log(e || r));  // <-- Return: hashTable | result

        //------[RENDER]------}>
        
        const template = "Hi, {name}!";
        const buttons = [["{btnMenu}", "{btnOptions}"]];
        const input = {
            "name":         "MiElPotato",

            "btnMenu":      "Menu +",
            "btnOptions":   "Options"
        };

        bot
            .answer()
            .text(template)
            .keyboard(buttons, "resize")
            .render(input) // <-- text + keyboard
            .send();
            
        bot
            .answer()
            .text("Msg: {0} + {1}")
            .render(["H", "i"]) // <-- text
            .keyboard([["X: {0}", "Y: {1}"]])
            .send();
    });
```

| Name              | Args                                                                                                          |
|-------------------|---------------------------------------------------------------------------------------------------------------|
|                   | -                                                                                                             |
| html              |  text, disable_web_page_preview, disable_notification, reply_to_message_id, reply_markup                      |
| markdown          |  text, disable_web_page_preview, disable_notification, reply_to_message_id, reply_markup                      |
|                   | -                                                                                                             |
| text              |  text, parse_mode, disable_web_page_preview, disable_notification, reply_to_message_id, reply_markup          |
| photo             |  photo, caption, disable_notification, reply_to_message_id, reply_markup                                      |
| audio             |  audio, performer, title, duration, caption, disable_notification, reply_to_message_id, reply_markup          |
| document          |  document, caption, disable_notification, reply_to_message_id, reply_markup                                   |
| sticker           |  sticker, disable_notification, reply_to_message_id, reply_markup                                             |
| video             |  video, width, height, duration, caption, disable_notification, reply_to_message_id, reply_markup             |
| voice             |  voice, duration, caption, disable_notification, reply_to_message_id, reply_markup                            |
| location          |  latitude, longitude, disable_notification, reply_to_message_id, reply_markup                                 |
| venue             |  latitude, longitude, title, address, foursquare_id, disable_notification, reply_to_message_id, reply_markup  |
| contact           |  phone_number, first_name, last_name, disable_notification, reply_to_message_id, reply_markup                 |
| chatAction        |  action                                                                                                       |
| game              |  game_short_name, disable_notification, reply_to_message_id, reply_markup                                     |
|                   | -                                                                                                             |
| inlineQuery       |  results, next_offset, is_personal, cache_time, switch_pm_text, switch_pm_parameter                           |
| callbackQuery     |  text, show_alert                                                                                             |



<a name="refTgUpload"></a>
#### Tg Upload 

```js
gBot.enable("tgUrlUpload");

gBot
    .polling()
    .on("text", function(bot, url) {
        bot.answer().photo(url).send();
    });
    
/*
Added the option to specify an HTTP URL for a file in all methods where InputFile or file_id can be used (except voice messages).
Telegram will get the file from the specified URL and send it to the user.
Files must be smaller than 5 MB for photos and smaller than 20 MB for all other types of content.
*/
```



<a name="refPlugin"></a>
#### Plugin 

```js
gSrv
    .use(function(bot, data, next) {
        console.log("Async | Type: %s", type);

        if(data === "next") {
            next();
        }
    })
    .use("text", function(bot) {
        console.log("F:Sync | Type: text");

        bot.user = {};
    })
    .use(function(bot) {
        bot.user.id = 1;
    });
    
gSrv
    .on("text", function(bot, data) {
        bot.user.id;
    });
```



<a name="refGoto"></a>
#### Goto 

```js
gSrv
    .use(function(bot, data, next) {
        next(data === "room" ? "room.menu" : "");
    })
    .use(function(bot) {
        console.log("If not the room");
        
        // return "room.menu";
    })
    
    .on("text", function(bot, data) { })
    .on("text:room.menu", function(bot, data) { });
```



<a name="refJSGenerators"></a>
#### JS Generators 

```js
gBot
    .polling(function* (bot) {
        const result = yield send(bot);
        console.info(result);

        yield error();
    })
    .catch(function* (error) {
        console.error(error);
    })
    
    .use(function* (bot) {
        yield auth("D", "13");
    })
    .use("text", function* (bot, data) {
        yield save();

        if(data === "key") {
            return "eventYield";
        }
    })

    .on("text:eventYield", function* (bot, data) {
        console.log("eventYield:", data);
    });

//----------------]>

function auth(login, password) {
    return new Promise(x => setTimeout(x, 1000));
}

function send(bot) {
    return bot.answer().text("Ok, let's go...").send();
}
```



<a name="refRender"></a>
#### Render 

```js
//-----[EJS]-----}>

gBot.engine(require("ejs"))

data = {"x": "H", "y": "i"};
bot.render("EJS | Text: <%= x %> + <%= y %>", data);

//-----[DEFAULT]-----}>

data = ["H", "i"];
bot.render("Array | Text: {0} + {1}", data);

data = {"x": "H", "y": "i"};
bot.render("Hashtable | Text: {x} + {y}", data);
```



<a name="refKeyboard"></a>
#### Keyboard 

```js
const rBot = require("telegram-bot-api-c");

function onMsg(bot) {
    const data = {};
    
    data.chat_id = bot.cid;
    data.text = "Hell Word!";
    
    data.reply_markup = bot.keyboard(); // Or: bot.keyboard.hide()
    data.reply_markup = bot.keyboard([["1", "2"], ["3"]]);
    
    data.reply_markup = bot.keyboard.hOx();
    data.reply_markup = bot.keyboard.inline.hOx();
    
    bot.api.sendMessage(data);
}

rBot.keyboard.numpad(true); // <-- Once
rBot.keyboard.numpad(false, true); // <-- Selective

rBot.keyboard.inline.numpad();

//------------------------------

rBot.keyboard(buttons[, params])
rBot.keyboard.inline(inlButtons, isVertically)

/*
  buttons:    `string`, `array of array` or `false`
  inlButtons: `string`, `array of array` or `object`
  params:     "resize once selective"
  
  v - vertically; h - horizontally;
  
  vOx, hOx, vPn, hPn, vLr, hLr, vGb, hGb
  abcd, numpad, hide
  
  Normal keyboard:
   vOx(once, selective)
   numpad(once, selective)
*/
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
| abcd              | ABCD                                 |
| numpad            | 0-9                                  |
|                   | -                                    |
| hide              |                                      |



<a name="refDownload"></a>
#### Download

```js
gBot.download("file_id", "dir"/*, callback*/);
gBot.download("file_id", "dir", "name.mp3"/*, callback*/);


gBot
    .download("file_id")
    .then(function(info) {
        info.stream.pipe(require("fs").createWriteStream("./" + info.name));
    });


gBot
    .download("file_id", function(error, info) {
        info.stream.pipe(require("fs").createWriteStream("./myFile"));
    });
```



<a name="refInlineQuery"></a>
#### InlineQuery

https://core.telegram.org/bots/inline

```js
gBot
    .polling()
    .on("inlineQuery", function(bot, data) {
        const idx = Date.now().toString(32) + Math.random().toString(24);
        const results = [
            {
                "type":         "article",
                "title":        "Title #1",
                "message_text": "Text...",

                "thumb_url":    "https://pp.vk.me/c627530/v627530230/2fce2/PF9loxF4ick.jpg"
            },

            {
                "type":         "article",
                "title":        "Title #2: " + data.query,
                "message_text": "Text...yeah"
            },

            {
                "type":         "photo",

                "photo_width":  128,
                "photo_height": 128,

                "photo_url":    "https://pp.vk.me/c627530/v627530230/2fce2/PF9loxF4ick.jpg",
                "thumb_url":    "https://pp.vk.me/c627530/v627530230/2fce2/PF9loxF4ick.jpg"
            }
        ]
            .map((t, i) => { t.id = idx + i; return t; });

        // results = {results};

        bot
            .answer()
            .inlineQuery(results)
            .send()
            .then(console.info, console.error);
    });

//------------]>

bot
    .api
    .answerInlineQuery({
        "inline_query_id": 0,
        "results":         results
    })
    .then(console.info, console.error);
```


<a name="refSendFileAsBuffer"></a>
#### Send file as Buffer

```js

const imgBuffer = require("fs").readFileSync(__dirname + "/MiElPotato.jpg");

//------------]>

objSrv
    .use(function(bot, next) {
        bot
            .answer()
            .photo(imgBuffer)
            .filename("MiElPotato.jpg") // <-- It is important
            .filename("/path/MiElPotato.jpg") // <-- Same as above
            .send();
    });
    
//------------]>

api.sendPhoto({
    "chat_id":      0,
    "photo":        imgBuffer,

    "filename":      "MiElPotato.jpg" // <-- It is important
});

api.sendDocument({
    "chat_id":      0,
    "document":     imgBuffer
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

> tg-api X sendMessage < "./examples/msg.json"

...

> tg-api X sendMessage
> {"chat_id": 0, "text": "Hi"}
> <enter> [\r\n]

(result)

> {"chat_id": 1, "text": "Hi 2"}
> <enter> [\r\n]

(result)
```



<a name="refTest"></a>
#### Test

```js
npm -g install mocha
npm install chai

set TELEGRAM_BOT_TOKEN=X
set TELEGRAM_CHAT_ID=X
set TELEGRAM_MSG_ID=X

cd <module>

npm test
```

![npm test][image-test]



#### Module 

| Method            | Arguments                                                                             | Note                                                                      |
|-------------------|---------------------------------------------------------------------------------------|---------------------------------------------------------------------------|
|                   | -                                                                                     |                                                                           |
| keyboard          | buttons[, params]                                                                     | return: object; buttons: string/array; params: "resize once selective"    |
| parseCmd          | text[, strict]                                                                        | return: {type, name, text, cmd}; strict: maxLen32 + alphanum + underscore |
|                   | -                                                                                     |                                                                           |
| call              | token, method[, data][, callback(error, buffer, response)][, proxy][, tgUrlUpload]    |                                                                           |
| call              | options{token, method, proxy, tgUrlUpload}[, data][, callback]                        |                                                                           |
| callJson          | token, method[, data][, callback(error, json, response)][, proxy][, tgUrlUpload]      |                                                                           |
| callJson          | options{token, method, proxy, tgUrlUpload}[, data][, callback]                        |                                                                           |


#### Instance

| Attribute         | Type           | Note                                 |
|-------------------|----------------|--------------------------------------|
|                   | -              |                                      |
| api               | object         | See [Telegram Bot API][3]            |
|                   | -              |                                      |
| keyboard          | function       |                                      |
| parseCmd          | function       |                                      |


| Method            | Arguments                                                             | Return                            |
|-------------------|-----------------------------------------------------------------------|-----------------------------------|
|                   | -                                                                     |                                   |
|                   | -                                                                     |                                   |
| enable            | key                                                                   | this                              |
| disable           | key                                                                   | this                              |
| enabled           | key                                                                   | true/false                        |
| disabled          | key                                                                   | true/false                        |
|                   | -                                                                     |                                   |
| engine            | instance                                                              | this                              |
| promise           | instance                                                              | this                              |
| token             | [token]                                                               | this or token                     |
| proxy             | [proxy]                                                               | this                              |
|                   | -                                                                     |                                   |
| call              | method[, data][, callback(error, buffer, response)]                   |                                   |
| callJson          | method[, data][, callback(error, json, response)]                     |                                   |
|                   | -                                                                     |                                   |
| render            | template, data                                                        | string                            |
| download          | fid[, dir][, name][, callback(error, info {id,size,file,stream})]     | promise or undefined              |
|                   | -                                                                     |                                   |
| http              | [options][, callback(bot, cmd)]                                       | object                            |
| polling           | [options][, callback(bot, cmd)]                                       | object                            |
| virtual           | [callback(bot, cmd)]                                                  | object                            |


#### Methods: Response Builder

| Name          | Args                                  | Note                                                              |
|---------------|---------------------------------------|-------------------------------------------------------------------|
|               | -                                     |                                                                   |
| inlineQuery   | (results)                             |                                                                   |
| callbackQuery | ([message])                           |                                                                   |
|               | -                                     |                                                                   |
| render        | (data)                                |                                                                   |
| keyboard      | (buttons[, params])                   |                                                                   |
| inlineKeyboard| (buttons[, isVertically])             |                                                                   |
|               | -                                     |                                                                   |
| isReply       | ([flag])                              |                                                                   |
| send          | ([callback])                          |                                                                   |
|               | -                                     |                                                                   |
| text          |                                       |                                                                   |
| photo         |                                       | Ext: jpg, jpeg, gif, tif, png, bmp                                |
| audio         |                                       | Ext: mp3                                                          |
| document      |                                       |                                                                   |
| sticker       |                                       | Ext: webp [, jpg, jpeg, gif, tif, png, bmp]                       |
| video         |                                       | Ext: mp4                                                          |
| voice         |                                       | Ext: ogg                                                          |
| location      |                                       |                                                                   |
| venue         |                                       |                                                                   |
| contact       |                                       |                                                                   |
| chatAction    |                                       |                                                                   |
| game          |                                       |                                                                   |

#### Methods: Server

| Name          | Arguments                                     | Return                                    |
|---------------|-----------------------------------------------|-------------------------------------------|
|               | -                                             |                                           |
|               | POLLING                                       |                                           |
|               | -                                             |                                           |
| start         |                                               | this                                      |
| stop          |                                               | this                                      |
|               | HTTP                                          |                                           |
|               | -                                             |                                           |
| bot           | bot[, path][, onMsg(json, request)]           | new srvInstance                           |
|               | -                                             |                                           |
|               | VIRTUAL                                       |                                           |
|               | -                                             |                                           |
| input         | error, data                                   |                                           |
| middleware    |                                               |                                           |
|               | -                                             |                                           |
|               | ALL                                           |                                           |
|               | -                                             |                                           |
| catch         | callback(error)                               | this                                      |
| use           | [type], [params], callback(bot[, data, next]) | this                                      |
| on            | type[, params], callback(data, params[, next])| this                                      |
| off           | [type][, callback]                            | this                                      |


<a name="refFieldsSrvBot"></a>
#### Fields: bot | srv.on('', bot => 0)

| Name              | Type                  | Note                                                   |
|-------------------|-----------------------|--------------------------------------------------------|
|                   | -                     |                                                        |
| isGroup           | boolean               | bot.isGroup = bot.message.chat.type === [super]group   |
| isReply           | boolean               | bot.isReply = !!bot.message.reply_to_message           |
|                   | -                     |                                                        |
| cqid              | string                | bot.cqid = bot.callbackQuery.id                        |
| qid               | string                | bot.qid = bot.inlineQuery.id                           |
| cid               | number                | bot.cid = bot.message.chat.id                          |
| mid               | number                | bot.mid = bot.message.message_id                       |
|                   | -                     |                                                        |
| command           | object                | Incoming command                                       |
|                   | -                     |                                                        |
| updateType        | string                |                                                        |
| updateSubType     | string                |                                                        |
| eventType         | string                |                                                        |
| eventSubType      | string                |                                                        |
| gotoState         | string                |                                                        |
|                   | -                     |                                                        |
| from              | object                | Persistent                                             |
|                   | -                     |                                                        |
| message           | object                | Incoming message                                       |
| inlineQuery       | object                | Incoming inline query                                  |
| chosenInlineResult| object                | The result of an inline query that was chosen          |
| callbackQuery     | object                | Incoming callback query                                |
|                   | -                     |                                                        |
| answer            | function()            | Response Builder; message; Uses: cid, mid              |
| answer            | function()            | Response Builder; inlineQuery; Uses: qid               |
| answer            | function()            | Response Builder; callbackQuery; Uses: cqid            |



#### Events: use / on

| Name              | Args                                  | Note                                      |
|-------------------|---------------------------------------|-------------------------------------------|
|                   | -                                     |                                           |
| message           | bot, message[, next]                  |                                           |
| editedMessage     | bot, message[, next]                  |                                           |
|                   | -                                     |                                           |
| channelPost       | bot, post[, next]                     |                                           |
| editedChannelPost | bot, post[, next]                     |                                           |
|                   | -                                     |                                           |
| inlineQuery       | bot, data[, next]                     |                                           |
| chosenInlineResult| bot, data[, next]                     |                                           |
| callbackQuery     | bot, data[, next]                     |                                           |
|                   | -                                     |                                           |
| pinnedMessage     | bot, message[, next]                  |                                           |
|                   | -                                     |                                           |
| enterChat         | bot, data[, next]                     |                                           |
| leftChat          | bot, data[, next]                     |                                           |
|                   | -                                     |                                           |
| chatTitle         | bot, data[, next]                     |                                           |
| chatNewPhoto      | bot, data[, next]                     |                                           |
| chatDeletePhoto   | bot, data[, next]                     |                                           |
|                   | -                                     |                                           |
| chatCreated       | bot, data[, next]                     |                                           |
| superChatCreated  | bot, data[, next]                     |                                           |
| channelChatCreated| bot, data[, next]                     |                                           |
|                   | -                                     |                                           |
| migrateToChatId   | bot, data[, next]                     |                                           |
| migrateFromChatId | bot, data[, next]                     |                                           |
|                   | -                                     |                                           |
| text              | bot, data[, next]                     |                                           |
| photo             | bot, data[, next]                     |                                           |
| audio             | bot, data[, next]                     |                                           |
| document          | bot, data[, next]                     |                                           |
| sticker           | bot, data[, next]                     |                                           |
| video             | bot, data[, next]                     |                                           |
| voice             | bot, data[, next]                     |                                           |
| location          | bot, data[, next]                     |                                           |
| venue             | bot, data[, next]                     |                                           |
| contact           | bot, data[, next]                     |                                           |
| game              | bot, data[, next]                     |                                           |
|                   | -                                     |                                           |
| *                 | bot, data[, next]                     |                                           |
| /[name]           | bot, params[, next]                   | CMD                                       |
|                   | -                                     |                                           |
| (regexp)          | bot, params[, next]                   |                                           |


## License

MIT

----------------------------------
[@ Daeren][1]
[@ Telegram][2]


[1]: http://666.io
[2]: https://telegram.me/io666
[3]: https://core.telegram.org/bots/api
[4]: https://npmjs.com/package/tgb-pl-botanio
[5]: https://core.telegram.org/bots/games
[10]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map
[100]: https://core.telegram.org/bots/2-0-intro

[image-architecture]: https://666.io/assets/img/telegram-bot-api-c/architecture.png?x=16
[image-test]: https://666.io/assets/img/telegram-bot-api-c/test.png?x=13

[cod_b]: https://img.shields.io/codacy/178f90f3c89945e7acb97b21140da7db.svg
[cod_l]: https://www.codacy.com/app/daeren/telegram-bot-api-c/dashboard