//-----------------------------------------------------
//
// Author: Daeren
// Site: 666.io
//
//-----------------------------------------------------

"use strict";

//-----------------------------------------------------

const gMethods = [];

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

    gMethods.push(name);
    gProtoTable[name.toLowerCase()] = gProtoTable[name];

    delete gProtoTable[name];
}

//-----------------------------------------------------

module.exports = {
    "methods":  gMethods,
    "params":   gProtoTable
};
