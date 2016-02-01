//-----------------------------------------------------
//
// Author: Daeren
// Site: 666.io
//
//-----------------------------------------------------

"use strict";

//-----------------------------------------------------

const gTypesMap = (function(data) {
    const result = Object.create(null);

    for(let type in data) {
        if(data.hasOwnProperty(type)) {
            result[type] = buildType(data[type]);
        }
    }

    return result;
})(
    {
        "user": [
            "integer:id",
            "string:first_name last_name username"
        ],

        "chat": [
            "integer:id",
            "string:type title first_name last_name username"
        ],

        "message": [
            "integer:message_id date forward_date migrate_to_chat_id migrate_from_chat_id",
            "user:from forward_from new_chat_participant left_chat_participant",
            "chat:chat",
            "message:reply_to_message",
            "string:text caption new_chat_title",
            "audio",
            "document",
            "*photoSize:photo new_chat_photo",
            "sticker",
            "video",
            "voice",
            "contact",
            "location",
            "boolean:delete_chat_photo group_chat_created supergroup_chat_created channel_chat_created"
        ],

        "photoSize": [
            "integer:width height file_size",
            "string:file_id"
        ],

        "audio": [
            "integer:duration file_size",
            "string:file_id performer title mime_type"
        ],

        "document": [
            "string:file_id file_name mime_type",
            "photoSize:thumb",
            "integer:file_size"
        ],

        "sticker": [
            "string:file_id",
            "photoSize:thumb",
            "integer:width height file_size"
        ],

        "video": [
            "string:file_id",
            "photoSize:thumb",
            "integer:width height duration mime_type file_size"
        ],

        "voice": [
            "integer:duration file_size",
            "string:file_id mime_type"
        ],

        "contact": [
            "string:phone_number first_name last_name user_id"
        ],

        "location": [
            "float:longitude latitude"
        ],

        "userProfilePhotos": [
            "integer:total_count",
            "**photoSize:photos"
        ],

        "file": [
            "string:file_id file_path",
            "integer:file_size"
        ],

        "replyKeyboardMarkup": [
            "string:keyboard",
            "boolean:resize_keyboard one_time_keyboard selective"
        ],

        "replyKeyboardHide": [
            "boolean:hide_keyboard selective"
        ],

        "forceReply": [
            "boolean:force_reply selective"
        ],

        "inlineQuery": [
            "user:from",
            "string:id query offset"
        ],

        "chosenInlineResult": [
            "user:from",
            "string:result_id query"
        ],

        "update": [
            "integer:update_id",
            "message",
            "inline_query:inlineQuery",
            "chosen_inline_result:chosenInlineResult"
        ]
    }
);

//-----------------------------------------------------

module.exports = main;

//-----------------------------------------------------

function main(data) {
    return sanitize("update", data);
}

//-----------------------------------------------------

function buildType(schema) {
    const fieldsParams = [];

    let fields      = [],
        fieldsLen   = 0;

    //--------------]>

    const result = function(data) {
        const r = {};

        //---------]>

        if(!data || typeof(data) !== "object") {
            return r;
        }

        for(let field, i = 0; i < fieldsLen; i++) {
            field = fields[i];

            if(Object.prototype.hasOwnProperty.call(data, field)) {
                const fieldData     = data[field];

                const fieldParams   = fieldsParams[field];

                const fieldType     = fieldParams[0],
                      fieldArray    = fieldParams[1];

                //---------]>

                switch(fieldArray) {
                    case 1:
                        r[field] = fieldData.map(d => sanitize(fieldType, d));
                        break;

                    case 2:
                        r[field] = fieldData.map(a => a.map(d => sanitize(fieldType, d)));
                        break;

                    default:
                        r[field] = sanitize(fieldType, fieldData);
                }
            }
         }

        return r;
    };

    //-----[Init: schema]-----}>

    schema.forEach(function(element) {
        element = element.split(":");

        let type      = element[0],
            tpFields  = (element[1] || type).split(" ");

        let typeArray;

        //---------]>

        for(let i = 0; i < type.length; i++) {
            if(type[i] !== "*") {
                type = type.substr(i);
                typeArray = i;

                break;
            }
        }

        fields = fields.concat(tpFields);

        tpFields.forEach(function(field) {
            fieldsParams[field] = [type, typeArray];
        });
    });

    fieldsLen = fields.length;

    //--------------]>

    return result;
}

function sanitize(type, data) {
    switch(type) {
        case "boolean":
            return !!data;

        case "integer":
            return parseInt(data, 10);

        case "float":
            return parseFloat(data);

        case "string":
            return typeof(data) === "string" ? data : (typeof(data) === "undefined" || data === null ? "" : data + "");

        case "inputFile":
            return data;

        default:
            const tp = gTypesMap[type];

            if(tp) {
                return tp(data);
            }

            throw new Error("Unknown type: " + type);
    }
}
