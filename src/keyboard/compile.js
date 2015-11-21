//-----------------------------------------------------
//
// Author: Daeren
// Site: 666.io
//
//-----------------------------------------------------

"use strict";

//-----------------------------------------------------

module.exports = main;

//-----------------------------------------------------

function main(input) {
    const map = {};

    const result = function(buttons, params) {
        if(typeof(buttons) === "string") {
            buttons = buttons.split(/\s+/).map(function(x) { return [x]; });
        }

        buttons = {"keyboard": buttons};

        if(!params) {
            return buttons;
        }

        if(!Array.isArray(params)) {
            params = params.split(/\s+/);
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
    };

    //----------]>

    for(let name in input.bin) {
        if(!input.bin.hasOwnProperty(name)) {
            continue;
        }

        let kb = input.bin[name];

        name = name[0].toUpperCase() + name.substr(1);

        map["v" + name] = kb.map(function(x) { return [x]; });
        map["h" + name] = [kb];
    }

    for(let name in map) {
        if(!map.hasOwnProperty(name)) {
            continue;
        }

        let kb = map[name];
        result[name] = genFKB("keyboard", kb, true);
    }

    for(let name in input.norm) {
        if(!input.norm.hasOwnProperty(name)) {
            continue;
        }

        let kb = input.norm[name];
        result[name] = genFKB("keyboard", kb);
    }

    //-----)>

    result.hide = genFKB("hide_keyboard");

    //----------]>

    return result;
}

//----------------------------------]>

function genFKB(type, kb, resize) {
    return function(once, selective) {
        const k = {};

        k[type] = kb || true;

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
    };
}