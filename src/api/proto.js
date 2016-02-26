//-----------------------------------------------------
//
// Author: Daeren
// Site: 666.io
//
//-----------------------------------------------------

"use strict";

//-----------------------------------------------------

module.exports = {
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


    "setWebhook": [
        ["string", "url"],
        ["certificate", "certificate"]
    ],


    "answerInlineQuery": [
        ["string", "inline_query_id"],
        ["string", "cache_time"],
        ["boolean", "is_personal"],
        ["string", "next_offset"],
        ["json", "results"]
    ]
};