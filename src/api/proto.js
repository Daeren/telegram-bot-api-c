//-----------------------------------------------------
//
// Author: Daeren
// Site: 666.io
//
//-----------------------------------------------------

"use strict";

//-----------------------------------------------------

const gMethods                      = [],
      gSendMethods                  = [];

const gAliasesSendMethods           = {},
      gAliasesSendMethodsFields     = {};

const gProtoTable = {
    "forwardMessage": [
        ["string", "chat_id"],
        ["string", "from_chat_id"],
        ["string", "message_id"]
    ],

    "sendMessage": [
        ["string", "chat_id"],
        ["string", "parse_mode"],
        ["boolean", "disable_web_page_preview"],
        ["string", "reply_to_message_id"],
        ["json", "reply_markup"],
        ["message", "text"]
    ],

    "sendPhoto": [
        ["string", "chat_id"],
        ["string", "caption"],
        ["string", "reply_to_message_id"],
        ["json", "reply_markup"],
        ["photo", "photo"]
    ],

    "sendAudio": [
        ["string", "chat_id"],
        ["string", "duration"],
        ["string", "performer"],
        ["string", "title"],
        ["string", "reply_to_message_id"],
        ["json", "reply_markup"],
        ["audio", "audio"]
    ],

    "sendDocument": [
        ["string", "chat_id"],
        ["string", "reply_to_message_id"],
        ["json", "reply_markup"],
        ["document", "document"]
    ],

    "sendSticker": [
        ["string", "chat_id"],
        ["string", "reply_to_message_id"],
        ["json", "reply_markup"],
        ["sticker", "sticker"]
    ],

    "sendVideo": [
        ["string", "chat_id"],
        ["string", "duration"],
        ["string", "caption"],
        ["string", "reply_to_message_id"],
        ["json", "reply_markup"],
        ["video", "video"]
    ],

    "sendVoice": [
        ["string", "chat_id"],
        ["string", "duration"],
        ["string", "reply_to_message_id"],
        ["json", "reply_markup"],
        ["voice", "voice"]
    ],

    "sendLocation": [
        ["string", "chat_id"],
        ["string", "latitude"],
        ["string", "longitude"],
        ["string", "reply_to_message_id"],
        ["json", "reply_markup"]
    ],

    "sendVenue": [
        ["string", "chat_id"],
        ["string", "latitude"],
        ["string", "longitude"],
        ["string", "title"],
        ["string", "address"],
        ["string", "foursquare_id"],
        ["boolean", "disable_notification"],
        ["string", "reply_to_message_id"],
        ["json", "reply_markup"]
    ],

    "sendContact": [
        ["string", "chat_id"],
        ["string", "phone_number"],
        ["string", "first_name"],
        ["string", "last_name"],
        ["boolean", "disable_notification"],
        ["string", "reply_to_message_id"],
        ["json", "reply_markup"]
    ],

    "sendChatAction": [
        ["string", "chat_id"],
        ["string", "action"]
    ],


    "getUserProfilePhotos": [
        ["string", "user_id"],
        ["string", "offset"],
        ["string", "limit"]
    ],

    "getUpdates": [
        ["string", "offset"],
        ["string", "limit"],
        ["string", "timeout"]
    ],

    "getFile": [
        ["string", "file_id"]
    ],

    "getMe": null,


    "setWebhook": [
        ["string", "url"],
        ["certificate", "certificate"]
    ],


    "answerInlineQuery": [
        ["string", "inline_query_id"],
        ["json", "results"],
        ["string", "cache_time"],
        ["boolean", "is_personal"],
        ["string", "next_offset"],
        ["string", "switch_pm_text"],
        ["string", "switch_pm_parameter"]
    ],

    "kickChatMember": [
        ["string", "chat_id"],
        ["string", "user_id"]
    ],

    "unbanChatMember": [
        ["string", "chat_id"],
        ["string", "user_id"]
    ],

    "answerCallbackQuery": [
        ["string", "callback_query_id"],
        ["string", "text"],
        ["boolean", "show_alert"]
    ],


    "editMessageText": [
        ["string", "chat_id"],
        ["string", "message_id"],
        ["string", "inline_message_id"],
        ["string", "text"],
        ["string", "parse_mode"],
        ["boolean", "disable_web_page_preview"],
        ["json", "reply_markup"]
    ],

    "editMessageCaption": [
        ["string", "chat_id"],
        ["string", "message_id"],
        ["string", "inline_message_id"],
        ["string", "caption"],
        ["json", "reply_markup"]
    ],

    "editMessageReplyMarkup": [
        ["string", "chat_id"],
        ["string", "message_id"],
        ["string", "inline_message_id"],
        ["json", "reply_markup"]
    ]
};

//-----------------------------------------------------

for(let name in gProtoTable) {
    if(!gProtoTable.hasOwnProperty(name)) {
        continue;
    }

    //----------]>

    const sendMethodMatch = name.match(/^send(.+)/);

    if(sendMethodMatch) {
        const shortName = sendMethodMatch[1][0].toLowerCase() + sendMethodMatch[1].substr(1),

              alias     = getAliasByShortMethod(shortName),
              dataField = getBaseDataFieldByShortMethod(shortName);

        gSendMethods.push(name);

        gAliasesSendMethods[alias] = name;
        gAliasesSendMethodsFields[alias] = dataField;
    }

    //----------]>

    gMethods.push(name);
    gProtoTable[name.toLowerCase()] = gProtoTable[name];

    //----------]>

    delete gProtoTable[name];
}

//-----------------------------------------------------

module.exports = {
    //------[HELPERS]------}>

    "methods":                  gMethods,

    "sendMethods":              gSendMethods,
    "aliasesSendMethods":       gAliasesSendMethods,
    "aliasesSendMethodsFields": gAliasesSendMethodsFields,

    //------[PROTO]------}>

    "params":                   gProtoTable,

    //------[METHODS]------}>

    genSendMethodsFor,
    dataModifierForSendMethod
};

//-----------------------------------------------------

function genSendMethodsFor(iter) {
    const aliases = gAliasesSendMethods;

    //--------]>

    for(let alias in aliases) {
        if(hasOwnProperty.call(aliases, alias)) {
            iter(alias, aliases[alias], gAliasesSendMethodsFields[alias]);
        }
    }
}

function dataModifierForSendMethod(method, input, output) {
    if(input === null || typeof(input) === "undefined") {
        return false;
    }

    switch(method) {
        case "sendLocation":
        case "sendVenue":
            if(typeof(input) === "string") {
                input = input.split(/\s+/);
            }

            if(Array.isArray(input)) {
                output.latitude = input[0];
                output.longitude = input[1];
            }
            else if(typeof(input) === "object") {
                output.latitude = input.latitude;
                output.longitude = input.longitude;
            }

            return true;

        default:
            return false;
    }
}

function getAliasByShortMethod(shortMethod) {
    switch(shortMethod) {
        case "message": return "text";

        default:        return shortMethod;
    }
}

function getBaseDataFieldByShortMethod(shortMethod) {
    switch(shortMethod) {
        case "message":     return "text";
        case "contact":     return "phone_number";
        case "chatAction":  return "action";

        default:            return shortMethod;
    }
}