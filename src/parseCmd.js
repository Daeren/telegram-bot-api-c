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
    if(!text || typeof(text) !== "string") {
        return null;
    }

    //---------]>

    const firstChar = text[0];

    let foundCmdParams,
        type, name, cmdText, cmd;

    //---------]>

    switch(firstChar) {
        case "/":
            foundCmdParams = text.match(gReFindCmd);

            if(foundCmdParams) {
                cmd = foundCmdParams[1];
                cmdText = foundCmdParams[2];

                if(cmd) {
                    type = "private";
                }
            }

            break;

        case "@":
            text = text.replace(gReReplaceName, "");

            if(text) {
                type = "private";
            }

            break;

        default:
            return null;
    }

    if(text !== "/") {
        if(!foundCmdParams) {
            foundCmdParams = text.split(gReSplitCmd, 2);

            cmd = foundCmdParams[0];
            cmdText = foundCmdParams[1];

            if(!cmd || cmd[0] !== "/") {
                return null;
            }
        }

        name = cmd === "/" ? "" : cmd.substr(1);
    }

    //---------]>

    return strict && name && (name.length > 32 || !gReValidCmd.test(name)) ? null : {
        "type": type || "common",
        "name": name || "",
        "text": cmdText || "",

        "cmd":  cmd || text
    };
}