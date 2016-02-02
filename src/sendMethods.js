//-----------------------------------------------------
//
// Author: Daeren
// Site: 666.io
//
//-----------------------------------------------------

"use strict";

//-----------------------------------------------------

const gMap      = {
    "text":         "sendMessage",
    "photo":        "sendPhoto",
    "audio":        "sendAudio",
    "document":     "sendDocument",
    "sticker":      "sendSticker",
    "video":        "sendVideo",
    "voice":        "sendVoice",
    "location":     "sendLocation",
    "chatAction":   "sendChatAction"
};

const gKeys     = Object.keys(gMap),
      gLen      = gKeys.length;

const gValues   = [];

//-----------------------------------------------------

gKeys.forEach(function(key) {
    gValues.push(gMap[key]);
});

//-----------------------------------------------------

module.exports = {
    "map":         gMap,
    "keys":        gKeys,
    "values":      gValues,
    "length":      gLen
};