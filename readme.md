[![Codacy][cod_b]][cod_l]

```
npm -g install telegram-bot-api-c
git clone https://github.com/Daeren/telegram-bot-api-c.git
```


```js
require("telegram-bot-api-c").call("TOKEN", "sendMessage", {"chat_id": 0, "text": "+"});
```

```js
require("telegram-bot-api-c")("TOKEN").api.sendMessage({"chat_id": 0, "text": "+"});
```

```js
require("telegram-bot-api-c")("TOKEN").polling(bot => bot.sendMessage("+"));
```

```js
> tg-api TOKEN sendMessage --chat_id=0 --text="+"
```


[Telegram Bot API][3]

* [Bot API 2.0][100]: +
* [Error codes](#refErrors): +
* KeepAlive (+50% to the speed of requests): +
* Support [Map][10] as a data source (.call, .callJson, .api[method]): +
* [InlineQuery](#refInlineQuery): +
* Analytics: [tgb-pl-botanio][4]
* Removed: bot.send(..), bot.broadcast(..)

```
- All methods in the Bot API are case-insensitive (method: .call, .callJson)

- message: buffer, stream, string
- photo|audio|voice|video|document|sticker: buffer, stream, file_id, path, url
- certificate: buffer, stream, path, url
```

#### Index

* [Start](#refStart)
* [Polling](#refPolling)
* [HTTP](#refHTTP)
* [Virtual](#refVirtual)
* [mServer](#refMServer)
* [Nginx + Node.js](#refExampleNginxNodejs)
* [Server Response](#refServerResponse)
* [Response Builder](#refResponseBuilder)
* [Plugin](#refPlugin)
* [Goto](#refGoto)
* [JS Generators](#refJSGenerators)
* [Render](#refRender)
* [Logger](#refLogger)
* [Keyboard](#refKeyboard)
* [Download](#refDownload)
* [InlineQuery](#refInlineQuery)
* [Errors](#refErrors)
* [CLI](#refCLI)
* [Test](#refTest)



![architecture][image-architecture]
![serverMsg][image-serverMsg]



<a name="refStart"></a>
#### Start

```js
const rTgBot    = require("telegram-bot-api-c");

const gBot      = rTgBot(process.env.TELEGRAM_BOT_TOKEN),
      gSrv      = gBot.polling(onDefault);

//-----------]>

gSrv
    .on("/start", onCmdStart)
    .on("/", onCmdNotFound)

    .on("enterChat", onEnterChat)
    .on("text", onText)
    .on("photo document", onPhotoOrDoc)
    .on("pinnedMessage", onPinnedMessage)
    
    .on("*", onNotFound)

    .on(/^id\s+(\d+)/i, onTextRegExp)
    .on(/^(id)\s+(\d+)/i, "type id", onTextRegExp)
    .on(/^(login)\s+(\w+)/i, ["type", "login"], onTextRegExp);


function onDefault(bot, cmd, gotoState) { }

function onCmdStart(bot, params) { }
function onCmdNotFound(bot, params, gotoState) { }

function onEnterChat(bot, member) { }
function onText(bot, text) { }
function onPhotoOrDoc(bot, data) { }
function onPinnedMessage(bot, message) { }

function onNotFound(bot, data, gotoState) { }

function onTextRegExp(bot, data) { }

//-----------]>

'bot' | gBot -> Sugar -> CtxPerRequest
'bot instanceof gBot.constructor' | true

cmd.type | common or private

/start [text] -> common
/start@bot [text] -> private
@bot /start [text] -> private

//----[API]----}>

const api      = gBot.api,
      keyboard = gBot.keyboard;

let file, data;

//----)>

file = __dirname + "/MiElPotato.jpg";
data = () => ({"chat_id": 0, "text": Date.now(), "photo": file, "caption": "#2EASY"});

api.sendMessage(data(), function(e, r) { });
api.sendMessage(data()).then(data).then(function(x) {
    x.photo = file;
    
    x.reply_markup = keyboard.hOx(/*once, selective*/);
    x.reply_markup = keyboard.inline.hOx();
    x.reply_markup = keyboard("X Y Z");
    x.reply_markup = keyboard([["X"]], "resize once selective");

    api.sendPhoto(x);
});
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
    const msg = bot.isGroup ? ">_>" : "Stop me: /stop";
    
    bot.answer(bot.isReply).text(msg).send();
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



<a name="refServerResponse"></a>
#### Server Response

```js
objSrv
    .use(function(type, bot, next) {
        const imgURL  = "https://pp.vk.me/c627530/v627530230/2fce2/PF9loxF4ick.jpg";
        
        const isReply = true,
              params  = {};
    
        //----[Send Reply | RBuilder: Queue]----}>
        
        bot.answer(isReply).text("=_=").photo(imgURL).send();
        
        //----[Send | RBuilder: One element]----}>
        
        bot.answer().text("Hi", params).send();
        
        //----[Send | RBuilder: Queue]----}>
        
        bot.answer().text("Hi").text("Hi 2").send();
        
        //----[Send_ELEMENT]----}>
        
        bot.sendMessage("Hello").then(console.log);
        bot.sendPhoto(imgURL, params);
        bot.sendDocument(imgURL, (e, r) => console.log(e || r));
        bot.sendLocation([60, 60]);
        
        //----[Forward]----}>

        bot.to = "chatId";
        bot.forward();
    });
```



<a name="refResponseBuilder"></a>
#### Response Builder

```js
objSrv
    .use(function(type, bot, next) {
        const params = {
            "parse_mode":   "markdown", // <-- text,
            "caption":      "myCaption" // <-- photo
        };
        
        bot
            .answer() // <-- Builder + Queue

            .chatAction("typing") // <-- Element

            .text("https://google.com", params) // <-- Element
            //.parseMode("markdown") <-- params.parse_mode
            .disableWebPagePreview() // <-- Modifier (for the last element)
            .keyboard([["X"], ["Y"]]) // <-- Modifier

            .chatAction("upload_photo")
            
            .photo("https://www.google.ru/images/logos/ps_logo2.png", params)
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
    .use(function(type, bot, next) {
        console.log("Async | Type: %s", type);

        if(bot.message.text === "next") {
            next();
        }
    })
    .use("text", function(bot /*, next*/) { // Filter by `type`
        console.log("F:Sync | Type: text");

        bot.user = {};
    })
    .use(function(type, bot) {
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
    .use(function(type, bot, next) {
        next(bot.message.text === "room" ? "room.menu" : "");
    })
    .use(function(type, bot) {
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
    .use(function* (type, bot) {
        yield auth("D", "13");
    })
    .use("text", function* (bot) {
        yield save();

        if(bot.message.text === "key") {
            return "eventYield";
        }
    })

    .on("text:eventYield", function(bot, data) {
        console.log("eventYield:", data);
    })
    .on("error", function(error) { // <-- Only for JS Generators
        console.error(error);
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
rBot.inline(buttons)

buttons: `string`, `array of array` or `false`
params: "resize once selective"

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
    .on("inlineQuery", function(bot, query) {
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
                "title":        "Title #2: " + query,
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
            .answer(results)
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



<a name="refErrors"></a>
#### Errors 

```js
const rBot    = require("telegram-bot-api-c");
const gBot    = rBot(process.env.TELEGRAM_BOT_TOKEN);

const api     = gBot.api;

//------------]>

api
    .sendMessage({"chat_id": "0"})
    .then(console.info, console.error);
    
api.sendMessage({"chat_id": "0", "text":"Hi"}, (e, data) => console.log(e || data));

// e    - Error: request/JSON.parse/response.ok
// data - JSON: response.result or null

//-------]>

gBot.callJson("sendMessage", {"chat_id": "0"}, (e, data) => console.log(e || data));

// e    - Error: request/JSON.parse
// data - JSON: response or null

//-------]>

gBot.call("sendMessage", {"chat_id": "0"}, (e, data) => console.log(e || data));

// e    - Error: request
// data - Buffer: response

//------------]>

// e.code           - api.sendMessage( ...
// data.error_code  - callJson("sendMessage" ...
//
// rBot or gBot
//
// gBot.ERR_INTERNAL_SERVER
// gBot.ERR_MESSAGE_LIMITS
// gBot.ERR_USED_WEBHOOK
// gBot.ERR_FORBIDDEN
// gBot.ERR_INVALID_TOKEN
// gBot.ERR_NOT_FOUND
// gBot.ERR_FAILED_PARSE_DATA
```


<a name="refSendFileAsBuffer"></a>
#### Send file as Buffer 

```js

const imgBuffer = require("fs").readFileSync(__dirname + "/MiElPotato.jpg");

//------------]>

objSrv
    .use(function(type, bot, next) {
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


#### Methods: polling

| Name          | Arguments                             | Return                                    |
|---------------|---------------------------------------|-------------------------------------------|
|               | -                                     |                                           |
| start         |                                       | this                                      |
| stop          |                                       | this                                      |
|               | -                                     |                                           |
| logger        | callback(error, buffer)               | this                                      |
| use           | [type], callback(type, bot[, next])   | this                                      |
| on            | type[, params], callback(data, params)| this                                      |
| off           | [type][, callback]                    | this                                      |

#### Methods: http

| Name          | Arguments                             | Return                                    |
|---------------|---------------------------------------|-------------------------------------------|
|               | -                                     |                                           |
| bot           | bot, path[, callback(json, request)]  | srv                                       |
|               | -                                     |                                           |
| logger        | callback(error, buffer)               | this                                      |
| use           | [type], callback(type, bot[, next])   | this                                      |
| on            | type[, params], callback(data, params)| this                                      |
| off           | [type][, callback]                    | this                                      |

#### Methods: virtual

| Name          | Arguments                             | Return                                    |
|---------------|---------------------------------------|-------------------------------------------|
| input         | error, data                           |                                           |
| middleware    |                                       |                                           |
|               | -                                     |                                           |
| logger        | callback(error, buffer)               | this                                      |
| use           | [type], callback(type, bot[, next])   | this                                      |
| on            | type[, params], callback(data, params)| this                                      |
| off           | [type][, callback]                    | this                                      |


#### Fields: bot (srv.on("*", bot => 0)

| Name              | Type                  | Note                                                   |
|-------------------|-----------------------|--------------------------------------------------------|
|                   | -                     |                                                        |
| isGroup           | boolean               | bot.isGroup = bot.message.chat.type === [super]group   |
| isReply           | boolean               | bot.isReply = !!bot.message.reply_to_message           |
|                   | -                     |                                                        |
| qid               | string                | bot.qid = bot.inlineQuery.id                           |
| cid               | number                | bot.cid = bot.message.chat.id                          |
| mid               | number                | bot.mid = bot.message.message_id                       |
| from              | number                | bot.from = bot.message.chat.id                         |
| to                | number                | bot.to = undefined                                     |
|                   | -                     |                                                        |
| message           | object                | Incoming message                                       |
|                   | -                     |                                                        |
| answer            | function(isReply)     | Response Builder; Uses: cid, mid                       |
| answer            | function(result)      | inlineQuery; Uses: qid                                 |
|                   | -                     |                                                        |
| forward           | function              | Uses: mid, from, to                                    |
| render            | function              | Uses: cid                                              |
|                   | -                     |                                                        |
| sendMessage       | function              |                                                        |
| sendPhoto         | function              |                                                        |
| sendAudio         | function              |                                                        |
| sendDocument      | function              |                                                        |
| sendSticker       | function              |                                                        |
| sendVideo         | function              |                                                        |
| sendVoice         | function              |                                                        |
| sendLocation      | function              |                                                        |
| sendVenue         | function              |                                                        |
| sendContact       | function              |                                                        |
| sendChatAction    | function              |                                                        |


#### Events: on

| Name              | Args                                  | Note                                      |
|-------------------|---------------------------------------|-------------------------------------------|
|                   | -                                     |                                           |
| inlineQuery       | bot, query                            |                                           |
| pinnedMessage     | bot, message                          |                                           |
|                   | -                                     |                                           |
| enterChat         | bot, data                             |                                           |
| leftChat          | bot, data                             |                                           |
|                   | -                                     |                                           |
| chatTitle         | bot, data                             |                                           |
| chatNewPhoto      | bot, data                             |                                           |
| chatDeletePhoto   | bot, data                             |                                           |
|                   | -                                     |                                           |
| chatCreated       | bot, data                             |                                           |
| superChatCreated  | bot, data                             |                                           |
| channelChatCreated| bot, data                             |                                           |
|                   | -                                     |                                           |
| migrateToChatId   | bot, data                             |                                           |
| migrateFromChatId | bot, data                             |                                           |
|                   | -                                     |                                           |
| text              | bot, data                             |                                           |
| photo             | bot, data                             |                                           |
| audio             | bot, data                             |                                           |
| document          | bot, data                             |                                           |
| sticker           | bot, data                             |                                           |
| video             | bot, data                             |                                           |
| voice             | bot, data                             |                                           |
| location          | bot, data                             |                                           |
| venue             | bot, data                             |                                           |
| contact           | bot, data                             |                                           |
|                   | -                                     |                                           |
| (regexp)          | data, params                          |                                           |
|                   | -                                     |                                           |
| /[name]           | data, params, state                   | CMD                                       |
| *                 | bot, cmd, state                       |                                           |


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

[image-architecture]: https://666.io/assets/img/telegram-bot-api-c/architecture.png?x=1101
[image-serverMsg]: https://666.io/assets/img/telegram-bot-api-c/serverMsg.png?x=1
[image-test]: https://666.io/assets/img/telegram-bot-api-c/test.png

[cod_b]: https://img.shields.io/codacy/88b55f71c45a47838d24ed1e5fd2476c.svg
[cod_l]: https://www.codacy.com/app/daeren/telegram-bot-api-c/dashboard