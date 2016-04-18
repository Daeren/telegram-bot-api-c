[![Codacy][cod_b]][cod_l]

```
npm -g install telegram-bot-api-c
git clone https://github.com/Daeren/telegram-bot-api-c.git
```


```js
require("telegram-bot-api-c").call("TOKEN", "sendMessage", {chat_id: 0, text: "+"})
```

```js
require("telegram-bot-api-c")("TOKEN").api.sendMessage({chat_id: 0, text: "+"})
```

```js
require("telegram-bot-api-c")("TOKEN").polling(bot => bot.answer().text("+").send())
```

```js
> tg-api TOKEN sendMessage --chat_id=0 --text="+"
```


[Telegram Bot API][3] and [Bot API 2.0][100]

* Support [Map][10] as a data source (.call, .callJson, .api[method]): +
* KeepAlive (+50% to the speed of requests): +
* Analytics: [tgb-pl-botanio][4]
* New: field bot.`from`, a mechanism of events, [Response Builder](#refResponseBuilder) takes all parameters for a API method
* Added: events, error handling, full support for generators
* Rewritten: server.onMsg, bot.answer
* Improved: `Response Builder`, srv.createBot
* Removed: srv.forward, srv.send[_], bot.send, bot.broadcast, srv.on(*), srv.on(/)

```
- All methods in the Bot API are case-insensitive (method: .call, .callJson)

- message:                                  buffer, stream, string
- location|venue|contact:                   buffer, string
- photo|audio|voice|video|document|sticker: buffer, stream, file_id, path, url
- certificate:                              buffer, stream, path, url
```

#### Index

* [Start](#refStart)
* [Polling](#refPolling)
* [HTTP](#refHTTP)
* [Virtual](#refVirtual)
* [mServer](#refMServer)
* [Nginx + Node.js](#refExampleNginxNodejs)
* [Response Builder](#refResponseBuilder)
* [Plugin](#refPlugin)
* [Goto](#refGoto)
* [JS Generators](#refJSGenerators)
* [Render](#refRender)
* [Logger](#refLogger)
* [Keyboard](#refKeyboard)
* [Download](#refDownload)
* [InlineQuery](#refInlineQuery)
* [CLI](#refCLI)
* [Test](#refTest)



![architecture][image-architecture]



<a name="refStart"></a>

```js
const rTgBot    = require("telegram-bot-api-c");

const gBot      = rTgBot(process.env.TELEGRAM_BOT_TOKEN),
      gApi      = gBot.api;

//----------------------------]>

gApi
    .sendMessage({"chat_id": "0"})
    .then(console.info, console.error);
    
gApi.sendMessage({"chat_id": "0", "text":"Hi"}, (e, data) => console.log(e || data));

// e    - Error: request/JSON.parse/response.ok
// data - JSON: response.result or null

//-------]>

gBot.callJson("sendMessage", {"chat_id": "0"}, (e, data, res) => console.log(e || data));

// e    - Error: request/JSON.parse
// data - JSON: response or null
// res  - Class: http.IncomingMessage

//-------]>

gBot.call("sendMessage", {"chat_id": "0"}, (e, data, res) => console.log(e || data));

// e    - Error: request
// data - Buffer: response or undefined
// res  - Class: http.IncomingMessage

//------------]>

/*
  e.code           - gApi.sendMessage( ...
  data.error_code  - callJson("sendMessage" ...
 
  rTgBot or gBot
 
  gBot.ERR_INTERNAL_SERVER
  gBot.ERR_MESSAGE_LIMITS
  gBot.ERR_USED_WEBHOOK
  gBot.ERR_FORBIDDEN
  gBot.ERR_INVALID_TOKEN
  gBot.ERR_NOT_FOUND
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

    .on(/^id\s+(\d+)/i, onTextRegExp)
    .on(/^(id)\s+(\d+)/i, "type id", onTextRegExp)
    .on(/^(login)\s+(\w+)/i, ["type", "login"], onTextRegExp);


function onDefault(bot, cmd, gotoState) { }
function onError(error) { }

function onCmdStart_1(bot, params, next) { next(); } // <-- Async
function onCmdStart_2(bot, params) { }               // <-- Sync
function onCmdStart_3(bot, params) { }               // <-- Sync | end

function onEnterChat(bot, member) { }
function onText(bot, text) { }
function onPhotoOrDoc(bot, data) { }
function onPinnedMessage(bot, message) { }

function onTextRegExp(bot, data) { }

//-----------]>

/*
  bot                               | gBot -> Sugar -> CtxPerRequest
  bot instanceof gBot.constructor   | true
  
  cmd.type                          | common or private
  
  /start [text]         -> common
  /start@bot [text]     -> private
  @bot /start [text]    -> private
*/
```



<a name="refPolling"></a>
#### Polling

```js
const objBot      = rBot(process.env.TELEGRAM_BOT_TOKEN);
const objOptions  = {
    "limit":    100,
    "timeout":  0,
    "interval": 2 // <-- Default / Sec.
};

let objSrv = objBot
    .polling(objOptions, cbMsg)
    .on("/stop", cbCmdStop);

function cbMsg(bot) {
    const msg = bot.isGroup && bot.isReply ? ">_>" : "Stop me: /stop";
    
    bot.answer().isReply().text(msg).send();
}

function cbCmdStop(bot, params) {
    objSrv.stop();
    
    bot.answer().text(JSON.stringify(params)).send();
}
```



<a name="refHTTP"></a>
#### HTTP

```js
const rBot = require("telegram-bot-api-c");

//-----------------------------------------------------

const objBotFather    = rBot();
const objSrvOptions   = {
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

const objMyBot    = rBot(process.env.TG_BOT_TOKEN_MY),
      objOtherBot = rBot(process.env.TG_BOT_TOKEN_OTHER);

let objSrv        = objBotFather.http(objSrvOptions);

objSrv
    .bot(objMyBot, "/urlMyBot") // <-- Auto-Webhook
    .on("/start", cbCmdStart)
    .on("/stop", cbCmdStop);

objSrv
    .bot(objOtherBot, "/urlOtherBot", cbOtherBot);
    
//------------------]>

function cbOtherBot(bot) { }

function cbCmdStart(bot, params) { }
function cbCmdStop(bot, params) { }
```



<a name="refVirtual"></a>
#### Virtual

```js
const objBot = rBot(process.env.TELEGRAM_BOT_TOKEN);
const objSrv = objBot
    .virtual(function(bot) {
        bot.answer().text("Not found!").send();
    })
    .on("photo", console.log);

//----[Proxy: express]----}>

objBot
    .api
    .setWebhook({"url": "https://site.xx/dev-bot"})
    .then(isOk => {
        const rExpress      = require("express"),
              rBodyParser   = require("body-parser");

        rExpress()
            .use(rBodyParser.json())
            .post("/dev-bot", objSrv.middleware)
            .listen(3000, "localhost");
    });
    
//----[Stress Tests]----}>

objSrv.input(null, {
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
const objBot = rBot(process.env.TELEGRAM_BOT_TOKEN);

objBot
    .api
    .setWebhook({"url": "https://site.xx/myBot"})
    .then(isOk => {
        if(!isOk)
            throw new Error("Oops...problems with webhook...");

        objBot.http(objSrvOptions, cbMsg);
    });
```



<a name="refExampleNginxNodejs"></a>
#### NGINX + Node.js

```js
const objBot          = rBot();
const objSrvOptions   = {
    "ssl":          false,

    "autoWebhook":  "site.xx:88", // <-- Default: (host + port); `false` - disable

    "host":         "localhost",
    "port":         1490
};

objBot.http(objSrvOptions, cbMsg);

//----[DEFAULT]----}>

objBot.http();
objBot.http(cbMsg);

// host: localhost
// port: 1488
// autoWebhook: false
// ssl: false
```



<a name="refResponseBuilder"></a>
#### Response Builder

```js
text(text, parse_mode, disable_web_page_preview, disable_notification, reply_to_message_id, reply_markup)
photo(photo, caption, disable_notification, reply_to_message_id, reply_markup)
audio(audio, performer, title, duration, disable_notification, reply_to_message_id, reply_markup)
document(document, caption, disable_notification, reply_to_message_id, reply_markup)
sticker(sticker, disable_notification, reply_to_message_id, reply_markup)
video(video, width, height, duration, caption, disable_notification, reply_to_message_id, reply_markup)
voice(voice, duration, disable_notification, reply_to_message_id, reply_markup)
location(latitude, longitude, disable_notification, reply_to_message_id, reply_markup)
venue(latitude, longitude, title, address, foursquare_id, disable_notification, reply_to_message_id, reply_markup)
contact(phone_number, first_name, last_name, disable_notification, reply_to_message_id, reply_markup)
chatAction(action)

inlineQuery(inline_query_id, results, next_offset, is_personal, cache_time, switch_pm_text, switch_pm_parameter)
callbackQuery(callback_query_id, text, show_alert)
```

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

            .location("50 50")
            .latitude(90)
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



<a name="refLogger"></a>
#### Logger 

```js
objBot
    .polling(objOptions, cbMsg)
    .logger(cbLogger);
    
objBot
    .http(objOptions, cbMsg)
    .logger(cbLogger);
    
objBot
    .http(objOptions)
    .bot(objMyBot, "/MyBot")
    .logger(cbLogger);
    
objBot
    .virtual(cbMsg)
    .logger(cbLogger);
    
//----------]>

function cbLogger(error, data) {
    if(!error) {
        data = data.toString(); // <-- Buffer
    }
}
```



<a name="refPlugin"></a>
#### Plugin 

```js
objSrv
    .use(function(bot, data, next) {
        console.log("Async | Type: %s", type);

        if(data === "next") {
            next();
        }
    })
    .use("text", function(bot /*, next*/) { // Filter by `type`
        console.log("F:Sync | Type: text");

        bot.user = {};
    })
    .use(function(bot) {
        console.log("Sync | Type: %s", type);
        
        bot.user.id = 1;
    });
    
objSrv
    .on("text", function(bot, data) {
        bot.user.id;
    });
```



<a name="refGoto"></a>
#### Goto 

```js
objSrv
    .use(function(bot, data, next) {
        next(data === "room" ? "room.menu" : "");
    })
    .use(function(bot) {
        console.log("If not the room");
        
        // return "room.menu";
    });

objSrv
    .on("text", function(bot, data) {
    });
    
objSrv
    .on("text:room.menu", function(bot, data) {
    });
    
// Does not work with: regEx
```



<a name="refJSGenerators"></a>
#### JS Generators 

```js
gBot
    .polling(function* (bot) {
        const result = yield send(bot);
        console.info(result);

        //x / 0;
        yield error();
    })
    .catch(function* (error) {
        console.error(error);
    })
    
    .use(function* (bot) {
        yield auth("D", "13");
    })
    .use("text", function* (bot) {
        yield save();

        if(bot.message.text === "key") {
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
    return bot.sendMessage("Ok, let's go...");
}
```



<a name="refRender"></a>
#### Render 

```js
objBot
    .engine(require("ejs"))
    .promise(require("bluebird"));

//--------------]> 

objBot.render("R: <%= value %>", {"value": 13});

//--------------]> 

objBot.polling(bot => {
    let data;
    
    //-----[DEFAULT]-----}>

    data = ["H", "i"];
    bot.render("Array | Text: {0} + {1}", data).then(console.log);

    data = {"x": "H", "y": "i"};
    bot.render("Hashtable | Text: {x} + {y}", data, (e, r) => console.log(e || r));

    //-----[EJS]-----}>

    data = {};
    data.input = {"x": "H", "y": "i"};
    data.reply_markup = bot.keyboard.hGb();

    bot.render("EJS | Text: <%= x %> + <%= y %>", data);
});
```



<a name="refKeyboard"></a>
#### Keyboard 

```js
const rBot = require("telegram-bot-api-c");

function cbMsg(bot) {
    const params = {};
    
    params.reply_markup = bot.keyboard() === bot.keyboard.hide();
    params.reply_markup = bot.keyboard([["1", "2"], ["3"]]);
    
    params.reply_markup = bot.keyboard.hOx();
    params.reply_markup = bot.keyboard.inline.hOx();
    
    bot.sendMessage("Hell Word!", params);
}

rBot.keyboard.numpad(true); // <-- Once
rBot.keyboard.numpad(false, true); // <-- Selective

rBot.keyboard.inline.numpad();

//------------------------------

rBot.keyboard(buttons[, params])
rBot.inline(inlButtons, isVertically)

buttons:    `string`, `array of array` or `false`
inlButtons: `string`, `array of array` or `object`
params:     "resize once selective"

v - vertically; h - horizontally;

vOx, hOx, vPn, hPn, vLr, hLr, vGb, hGb
abcd, numpad, hide

Normal keyboard:
 vOx(once, selective)
 numpad(once, selective)
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
objBot.download("file_id", "dir"/*, callback*/);
objBot.download("file_id", "dir", "name.mp3"/*, callback*/);


objBot
    .download("file_id")
    .then(function(info) {
        info.stream.pipe(require("fs").createWriteStream("./" + info.name));
    });


objBot
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

        /*
        results = {
            "results":          results
        };
        */

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

| Method            | Arguments                                                           | Note                                                                      |
|-------------------|---------------------------------------------------------------------|---------------------------------------------------------------------------|
|                   | -                                                                   |                                                                           |
| keyboard          | buttons[, params]                                                   | return: object; buttons: string/array; params: "resize once selective"    |
| parseCmd          | text[, strict]                                                      | return: {type, name, text, cmd}; strict: maxLen32 + alphanum + underscore |
|                   | -                                                                   |                                                                           |
| call              | token, method[, data][, callback(error, buffer, response)]          |                                                                           |
| callJson          | token, method[, data][, callback(error, json, response)]            |                                                                           |


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

| Name          | Type                                  | Note                                                              |
|---------------|---------------------------------------|-------------------------------------------------------------------|
|               | -                                     |                                                                   |
| text          | string, buffer, stream                |                                                                   |
| photo         | string, buffer, stream                | Ext: jpg, jpeg, gif, tif, png, bmp                                |
| audio         | string, buffer, stream                | Ext: mp3                                                          |
| document      | string, buffer, stream                |                                                                   |
| sticker       | string, buffer, stream                | Ext: webp [, jpg, jpeg, gif, tif, png, bmp]                       |
| video         | string, buffer, stream                | Ext: mp4                                                          |
| voice         | string, buffer, stream                | Ext: ogg                                                          |
| location      | string, buffer, json                  | Format: "60.0 60.0", [60, 60], {"latitude": 60, "longitude": 60}  |
| venue         | string, buffer, json                  | Format: "60.0 60.0", [60, 60], {"latitude": 60, "longitude": 60}  |
| contact       | string, buffer                        |                                                                   |
| chatAction    | string, buffer                        |                                                                   |
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



#### Methods: polling

| Name          | Arguments                                     | Return                                    |
|---------------|-----------------------------------------------|-------------------------------------------|
|               | -                                             |                                           |
| start         |                                               | this                                      |
| stop          |                                               | this                                      |
|               | -                                             |                                           |
| logger        | callback(error, buffer)                       | this                                      |
| catch         | callback(error)                               | this                                      |
| use           | [type], callback(bot[, data, next])           | this                                      |
| on            | type[, params], callback(data, params[, next])| this                                      |
| off           | [type][, callback]                            | this                                      |

#### Methods: http

| Name          | Arguments                                     | Return                                    |
|---------------|-----------------------------------------------|-------------------------------------------|
|               | -                                             |                                           |
| bot           | bot, path[, callback(json, request)]          | srv                                       |
|               | -                                             |                                           |
| logger        | callback(error, buffer)                       | this                                      |
| catch         | callback(error)                               | this                                      |
| use           | [type], callback(bot[, data, next])           | this                                      |
| on            | type[, params], callback(data, params[, next])| this                                      |
| off           | [type][, callback]                            | this                                      |

#### Methods: virtual

| Name          | Arguments                                     | Return                                    |
|---------------|-----------------------------------------------|-------------------------------------------|
| input         | error, data                                   |                                           |
| middleware    |                                               |                                           |
|               | -                                             |                                           |
| logger        | callback(error, buffer)                       | this                                      |
| catch         | callback(error)                               | this                                      |
| use           | [type], callback(bot[, data, next])           | this                                      |
| on            | type[, params], callback(data, params[, next])| this                                      |
| off           | [type][, callback]                            | this                                      |


#### Fields: bot (srv.on("*", bot => 0)

| Name              | Type                  | Note                                                   |
|-------------------|-----------------------|--------------------------------------------------------|
|                   | -                     |                                                        |
| isGroup           | boolean               | bot.isGroup = bot.message.chat.type === [super]group   |
| isReply           | boolean               | bot.isReply = !!bot.message.reply_to_message           |
|                   | -                     |                                                        |
| cqid              | string                | bot.qid = bot.callbackQuery.id                         |
| qid               | string                | bot.qid = bot.inlineQuery.id                           |
| cid               | number                | bot.cid = bot.message.chat.id                          |
| mid               | number                | bot.mid = bot.message.message_id                       |
|                   | -                     |                                                        |
| from              | object                | bot.from = bot.message.from; (!) persistent            |
|                   | -                     |                                                        |
| message           | object                | Incoming message                                       |
| inlineQuery       | object                | Incoming inline query                                  |
| chosenInlineResult| object                | The result of an inline query that was chosen          |
| callbackQuery     | object                | Incoming callback query                                |
|                   | -                     |                                                        |
| answer            | function()            | Response Builder; message; Uses: cid, mid              |
| answer            | function()            | Response Builder; inlineQuery; Uses: qid               |
| answer            | function()            | Response Builder; callbackQuery; Uses: cqid            |
|                   | -                     |                                                        |
| render            | function(tmpl, in, cb)| Uses: cid                                              |


#### Events: use / on

| Name              | Args                                  | Note                                      |
|-------------------|---------------------------------------|-------------------------------------------|
|                   | -                                     |                                           |
| message           | bot, message[, next]                  |                                           |
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
|                   | -                                     |                                           |
| (regexp)          | bot, params[, next]                   |                                           |
|                   | -                                     |                                           |
| /name             | data, params[, next]                  | CMD                                       |


## License

MIT

----------------------------------
[@ Daeren][1]
[@ Telegram][2]


[1]: http://666.io
[2]: https://telegram.me/io666
[3]: https://core.telegram.org/bots/api
[4]: https://npmjs.com/package/tgb-pl-botanio
[10]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map
[100]: https://core.telegram.org/bots/2-0-intro

[image-architecture]: https://666.io/assets/img/telegram-bot-api-c/architecture.png?x=123
[image-test]: https://666.io/assets/img/telegram-bot-api-c/test.png?x=2

[cod_b]: https://img.shields.io/codacy/88b55f71c45a47838d24ed1e5fd2476c.svg
[cod_l]: https://www.codacy.com/app/daeren/telegram-bot-api-c/dashboard