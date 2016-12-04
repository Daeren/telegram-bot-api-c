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

const gAliasesSendMethods           = {};

const gProtoTable = {
    "forwardMessage": [
        ["string",  "chat_id"],
        ["string",  "from_chat_id"],
        ["boolean", "disable_notification"],
        ["string",  "message_id"]
    ],


    "sendMessage": [
        ["string",  "chat_id"],
        ["message", "text"],
        ["string",  "parse_mode"],
        ["boolean", "disable_web_page_preview"],
        ["boolean", "disable_notification"],
        ["string",  "reply_to_message_id"],
        ["json",    "reply_markup"]
    ],

    "sendPhoto": [
        ["string", "chat_id"],
        ["photo", "photo"],
        ["string", "caption"],
        ["boolean", "disable_notification"],
        ["string", "reply_to_message_id"],
        ["json", "reply_markup"]
    ],

    "sendAudio": [
        ["string", "chat_id"],
        ["audio", "audio"],
        ["string", "caption"],
        ["string", "duration"],
        ["string", "performer"],
        ["string", "title"],
        ["boolean", "disable_notification"],
        ["string", "reply_to_message_id"],
        ["json", "reply_markup"]
    ],

    "sendDocument": [
        ["string", "chat_id"],
        ["document", "document"],
        ["string", "caption"],
        ["boolean", "disable_notification"],
        ["string", "reply_to_message_id"],
        ["json", "reply_markup"]
    ],

    "sendSticker": [
        ["string", "chat_id"],
        ["sticker", "sticker"],
        ["boolean", "disable_notification"],
        ["string", "reply_to_message_id"],
        ["json", "reply_markup"]
    ],

    "sendVideo": [
        ["string", "chat_id"],
        ["video", "video"],
        ["string", "duration"],
        ["string", "width"],
        ["string", "height"],
        ["string", "caption"],
        ["boolean", "disable_notification"],
        ["string", "reply_to_message_id"],
        ["json", "reply_markup"]
    ],

    "sendVoice": [
        ["string", "chat_id"],
        ["voice", "voice"],
        ["string", "caption"],
        ["string", "duration"],
        ["boolean", "disable_notification"],
        ["string", "reply_to_message_id"],
        ["json", "reply_markup"]
    ],

    "sendLocation": [
        ["string", "chat_id"],
        ["string", "latitude"],
        ["string", "longitude"],
        ["boolean", "disable_notification"],
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

    "sendGame": [
        ["string", "chat_id"],
        ["string", "game_short_name"],
        ["boolean", "disable_notification"],
        ["string", "reply_to_message_id"],
        ["json", "reply_markup"]
    ],


    "getChat": [
        ["string", "chat_id"]
    ],

    "getChatAdministrators": [
        ["string", "chat_id"]
    ],

    "getChatMembersCount": [
        ["string", "chat_id"]
    ],

    "getChatMember": [
        ["string", "chat_id"],
        ["string", "user_id"]
    ],

    "getUserProfilePhotos": [
        ["string", "user_id"],
        ["string", "offset"],
        ["string", "limit"]
    ],

    "getUpdates": [
        ["string", "offset"],
        ["string", "limit"],
        ["string", "timeout"],
        ["json", "allowed_updates"]
    ],

    "getFile": [
        ["string", "file_id"]
    ],

    "getMe": null,

    "getWebhookInfo": null,

    "getGameHighScores": [
        ["string", "user_id"],
        ["string", "chat_id"],
        ["string", "message_id"],
        ["string", "inline_message_id"]
    ],


    "setWebhook": [
        ["string", "url"],
        ["certificate", "certificate"],
        ["string", "max_connections"],
        ["json", "allowed_updates"]
    ],

    "setGameScore": [
        ["string", "user_id"],
        ["string", "score"],
        ["boolean", "force"],
        ["boolean", "disable_edit_message"],
        ["string", "chat_id"],
        ["string", "message_id"],
        ["string", "inline_message_id"]
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

    "answerCallbackQuery": [
        ["string", "callback_query_id"],
        ["string", "text"],
        ["boolean", "show_alert"],
        ["string", "url"],
        ["string", "cache_time"]
    ],


    "leaveChat": [
        ["string",  "chat_id"]
    ],

    "kickChatMember": [
        ["string", "chat_id"],
        ["string", "user_id"]
    ],

    "unbanChatMember": [
        ["string", "chat_id"],
        ["string", "user_id"]
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
    ],


    "deleteWebhook": null
};

const gArgsTable  = {
    "forwardMessage": [
        "chat_id",
        "from_chat_id",
        "message_id",
        "disable_notification"
    ],


    "sendMessage": [
        "chat_id",
        "text",
        "parse_mode",
        "disable_web_page_preview",
        "disable_notification",
        "reply_to_message_id",
        "reply_markup"
    ],

    "sendPhoto": [
        "chat_id",
        "photo",
        "caption",
        "disable_notification",
        "reply_to_message_id",
        "reply_markup"
    ],

    "sendAudio": [
        "chat_id",
        "audio",
        "performer",
        "title",
        "duration",
        "caption",
        "disable_notification",
        "reply_to_message_id",
        "reply_markup"
    ],

    "sendDocument": [
        "chat_id",
        "document",
        "caption",
        "disable_notification",
        "reply_to_message_id",
        "reply_markup"
    ],

    "sendSticker": [
        "chat_id",
        "sticker",
        "disable_notification",
        "reply_to_message_id",
        "reply_markup"
    ],

    "sendVideo": [
        "chat_id",
        "video",
        "width",
        "height",
        "duration",
        "caption",
        "disable_notification",
        "reply_to_message_id",
        "reply_markup"
    ],

    "sendVoice": [
        "chat_id",
        "voice",
        "duration",
        "caption",
        "disable_notification",
        "reply_to_message_id",
        "reply_markup"
    ],

    "sendLocation": [
        "chat_id",
        "latitude",
        "longitude",
        "disable_notification",
        "reply_to_message_id",
        "reply_markup"
    ],

    "sendVenue": [
        "chat_id",
        "latitude",
        "longitude",
        "title",
        "address",
        "foursquare_id",
        "disable_notification",
        "reply_to_message_id",
        "reply_markup"
    ],

    "sendContact": [
        "chat_id",
        "phone_number",
        "first_name",
        "last_name",
        "disable_notification",
        "reply_to_message_id",
        "reply_markup"
    ],

    "sendChatAction": [
        "chat_id",
        "action"
    ],

    "sendGame": [
        "chat_id",
        "game_short_name",
        "disable_notification",
        "reply_to_message_id",
        "reply_markup"
    ],


    "getChat": [
        "chat_id"
    ],

    "getChatAdministrators": [
        "chat_id"
    ],

    "getChatMembersCount": [
        "chat_id"
    ],

    "getChatMember": [
        "chat_id",
        "user_id"
    ],

    "getUserProfilePhotos": [
        "user_id",
        "offset",
        "limit"
    ],

    "getUpdates": [
        "offset",
        "limit",
        "timeout",
        "allowed_updates"
    ],

    "getFile": [
        "file_id"
    ],

    "getGameHighScores": [
        "user_id",
        "chat_id",
        "message_id",
        "inline_message_id"
    ],


    "setWebhook": [
        "url",
        "certificate",
        "max_connections",
        "allowed_updates"
    ],

    "setGameScore": [
        "user_id",
        "score",
        "force",
        "disable_edit_message",
        "chat_id",
        "message_id",
        "inline_message_id"
    ],


    "answerInlineQuery": [
        "inline_query_id",
        "results",
        "next_offset",
        "is_personal",
        "cache_time",
        "switch_pm_text",
        "switch_pm_parameter"
    ],

    "answerCallbackQuery": [
        "callback_query_id",
        "text",
        "show_alert",
        "url",
        "cache_time"
    ],


    "leaveChat": [
        "chat_id"
    ],

    "kickChatMember": [
        "chat_id",
        "user_id"
    ],

    "unbanChatMember": [
        "chat_id",
        "user_id"
    ],


    "editMessageText": [
        "chat_id",
        "text",
        "message_id",
        "inline_message_id",
        "parse_mode",
        "disable_web_page_preview",
        "reply_markup"
    ],

    "editMessageCaption": [
        "chat_id",
        "caption",
        "message_id",
        "inline_message_id",
        "reply_markup"
    ],

    "editMessageReplyMarkup": [
        "chat_id",
        "reply_markup",
        "message_id",
        "inline_message_id"
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
              alias     = getAliasByShortMethod(shortName);

        //----]>

        gSendMethods.push(name);

        gAliasesSendMethods[alias] = name;
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

    //------[PROTO]------}>

    "params":                   gProtoTable,
    "args":                     gArgsTable,

    //------[METHODS]------}>

    genAliasesSendMethodsFor
};

//-----------------------------------------------------

function genAliasesSendMethodsFor(iter) {
    const aliases = gAliasesSendMethods;

    //--------]>

    for(let alias in aliases) {
        if(hasOwnProperty.call(aliases, alias)) {
            iter(alias, aliases[alias]);
        }
    }
}

function getAliasByShortMethod(shortMethod) {
    switch(shortMethod) {
        case "message": return "text";

        default:        return shortMethod;
    }
}