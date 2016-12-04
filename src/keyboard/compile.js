//-----------------------------------------------------
//
// Author: Daeren
// Site: 666.io
//
//-----------------------------------------------------

"use strict";

//-----------------------------------------------------

const gReKbParamsExplode = /\s+/;

//-----------------------------------------------------

module.exports = main;

//-----------------------------------------------------

function main(input) {
    const map = {};

    //----------]>

    for(let name in input.bin) {
        if(input.bin.hasOwnProperty(name)) {
            const kb = input.bin[name];

            name = name[0].toUpperCase() + name.substr(1);

            map["v" + name] = kb.map(x => [x]);
            map["h" + name] = [kb];
        }
    }

    for(let name in input.norm) {
        if(input.norm.hasOwnProperty(name)) {
            const kb = input.norm[name];

            keyboardBuilder[name] = genFKB("keyboard", kb, false);
            inlineKeyboardBuilder[name] = genFKB("inline_keyboard", kb, false, true);
        }
    }

    for(let name in map) {
        if(map.hasOwnProperty(name)) {
            const kb = map[name];

            keyboardBuilder[name] = genFKB("keyboard", kb, true);
            inlineKeyboardBuilder[name] = genFKB("inline_keyboard", kb, true, true);
        }
    }

    //-----)>

    keyboardBuilder.inline = inlineKeyboardBuilder;
    keyboardBuilder.hide = genFKB("remove_keyboard");

    //----------]>

    return keyboardBuilder;

    //----------]>

    function inlineKeyboardBuilder(buttons, isV) {
        if(typeof(buttons) === "string") {
            buttons = buttons.split(/\s+/).map(text => {
                text = {text, "callback_data": text};
                return isV ? [text] : text;
            });

            buttons = {
                "inline_keyboard": isV ? buttons : [buttons]
            };
        }
        else if(Array.isArray(buttons)) {
            buttons = {
                "inline_keyboard": buttons
            };
        }

        return buttons;
    }

    function keyboardBuilder(buttons, params) {
        buttons = typeof(buttons) === "string" ? buttons.split(/\s+/).map(x => [x]) : buttons;
        buttons = buttons === false || !arguments.length ? {"remove_keyboard": true} : {"keyboard": buttons};

        if(!params) {
            return buttons;
        }

        if(!Array.isArray(params)) {
            params = params.split(gReKbParamsExplode);
        }

        if(params.indexOf("resize") !== -1) {
            buttons.resize_keyboard = true;
        }

        if(params.indexOf("once") !== -1) {
            buttons.one_time_keyboard = true;
        }

        if(params.indexOf("selective") !== -1) {
            buttons.selective = true;
        }

        return buttons;
    }
}

//----------------------------------]>

function genFKB(type, kb, resize, inline) {
    return inline ? inlineKb : normalKb;

    //----------]>

    function inlineKb() {
        return {
            [type]: kb.map(x => (Array.isArray(x) ? x.map(y => ({"text": y, "callback_data": y})) : {"text": x, "callback_data": x}))
        };
    }

    function normalKb(once, selective) {
        const k = {
            [type]: kb || true
        };

        if(resize) {
            k.resize_keyboard = true;
        }

        if(once) {
            k.one_time_keyboard = true;
        }

        if(selective) {
            k.selective = true;
        }

        return k;
    }
}