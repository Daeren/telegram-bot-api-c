//-----------------------------------------------------
//
// Author: Daeren
// Site: 666.io
//
//-----------------------------------------------------

"use strict";

//-----------------------------------------------------

const gReReplaceName  = /^@\S+\s+/,

      gReFindCmd      = /(^\/\S*?)@\S+\s*(.*)/,
      gReSplitCmd     = /\s+([\s\S]+)?/,
      gReValidCmd     = /[\w]+/i;

//-----------------------------------------------------

module.exports = main;

//-----------------------------------------------------

function main(text, strict) {
    if(typeof(text) !== "string" || text.length <= 1 || text[0] !== "/" && text[0] !== "@") {
        return null;
    }

    //---------]>

    let t,

        type = "common",
        name, cmdText, cmd;

    //---------]>

    switch(text[0]) {
        case "/":
            t = text.match(gReFindCmd);

            if(!t) {
                break;
            }

            cmd = t[1];
            cmdText = t[2];

            if(cmd) {
                type = "private";
            }

            break;

        case "@":
            text = text.replace(gReReplaceName, "");

            if(text) {
                type = "private";
            }

            break;
    }

    if(!t) {
        t = text.split(gReSplitCmd, 2);

        cmd = t[0];
        cmdText = t[1];

        if(!cmd || cmd[0] !== "/" || cmd === "/") {
            return null;
        }
    }

    name = cmd.substr(1);

    //---------]>

    if(strict && (name.length > 32 || !gReValidCmd.test(name))) {
        return null;
    }

    //---------]>

    return {
        "type": type,
        "name": name,
        "text": cmdText || "",

        "cmd":  cmd
    };
}