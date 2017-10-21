let { Parser, MsgEdit } = require("./parsing.js");
let { RichEmbed } = require("discord.js");

/**
 * An easy way to replace a string with another string
 * 
 * @property {string[]} find - a list of string you're looking to replace
 * @property {string} replace - the string you want to replace the finds with
 */
class Replacer {
    /**
     * @param {string[]} find 
     * @param {string} replace 
     */
    constructor(find, replace) {
        this.find = find;
        this.replace = replace;
    }
}

/**
 * An easy way to apply things to groups of text
 * 
 * @property {string[]} keys - An array of the acceptable terms you can type inside the grouping beginning/end symbols to activate
 * @property {function} apply - A function that actually does things to the grouped text
 * */
class GroupApplier {
    /**
     * 
     * @param {string[]} keys 
     * @param {function(string, string[]): MsgEdit} applyFunc 
     */
    constructor(keys, applyFunc) {
        this.keys = keys;
        this.apply = applyFunc;
    }
}

/**
 * A class to store information about what groups will be applied
 * 
 * @property {GroupApplier} group - The group that will be used to apply
 * @property {string[]} args      - The arguements that will go into the apply function
 * @property {number} begin       - The index where the group starts in the list of words
 * @property {number} end         - The index where the group ends in the list of words
 * */
class Applier {

    /**
     * @param {GroupApplier} group
     * @param {string[]} args
     * @param {number} begin
     * @param {number} end
     **/
    constructor(group, args, begin, end) {
        this.group = group;
        this.args = args;
        this.begin = begin;
        this.end = end;
    }
}

/**The list of replacers */
let replacers = [

    //defaults

    new Replacer(["(lenny)"], "( ͡° ͜ʖ ͡°)"),
    new Replacer(["(tm)"], "™")
];

/**The list of group appliers */
let groups = [

    //defaults

    new GroupApplier(
        ["embed"],
        (text, args) => {
            return { options: { embed: new RichEmbed()
                .setDescription(text)
                .setColor(args.color)
            }};
        }
    ),

    new GroupApplier(
        ["long"],
        (text, args) => {
            let spaces = "   ";
            if (args.spaces != null) {
                for (let i = 0; i < args.spaces; i++) {
                    spaces += " ";
                }
            }
            text = text.split(" ").join(spaces);
            return { msg: text.split("").join(spaces) };
        }
    )
];

let options = {
    /**options for group appliers */
    grouping: {
        /**The string that starts groups */
        groupStart: "[",
        /**The string that ends groups */
        groupEnd: "]",
        /**The string that terminates groups */
        groupTerminator: "/",
        /**The seperator for arguements in groups */
        argSeperator: ","
    }
}

/**
 * @param {string} msg 
 * @return {string}
 */
let applyReplacing = function (msg) {
    for (let r of replacers) {
        for (let find of r.find) {
            msg = msg.split(find).join(r.replace);
        }
    }
    return msg;
}

/**
 * @param {string} word 
 * @param {number} index 
 * @param {Applier[]} applying 
 */
let applyGrouping = function (word, wordLength, index, applying) {

    let start = options.grouping.groupStart;
    let end = options.grouping.groupEnd;
    let terminator = options.grouping.groupTerminator;
    let argSeparator = options.grouping.argSeperator;

    if (word.startsWith(start) && word.endsWith(end)) {

        for (let group of groups) {
            for (let key of group.keys) {

                if (word.slice(1, key.length + 1) == key) {

                    let argsRaw = word.slice(1, word.length - 1).split(argSeparator);
                    argsRaw.shift();
                    let args = {};
                    for (let argRaw of argsRaw) {
                        args[argRaw.split("=")[0]] = argRaw.split("=")[1];
                    }
                    applying.push(new Applier(group, args, index, wordLength));
                    return;

                } else if (word.slice(1, key.length + 2) == terminator + key) {

                    for (let applier of applying) {
                        if (applier.group.keys == group.keys) {
                            applier.end = index;
                            return;
                        }
                    }
                    return;
                }
            }
        }
    }
}

/**
 * @param {Applier[]} appliers 
 * @param {string[]} words 
 * @return {MsgEdit}
 */
let applyAppliers = function (appliers, words) {

    let edit = new MsgEdit();

    for (let applier of appliers) {
        let currentEdit = applier.group.apply(words.slice(parseInt(applier.begin) + 1, applier.end).join(" "), applier.args);
        words[applier.begin] = currentEdit.msg;
        if (edit.options == null) {
            edit.options = currentEdit.options;
        }
        for (let word in words) {
            if (word > applier.begin && word <= applier.end) {
                words[word] = null;
            }
        }
    }

    for (let word = 0; word < words.length; word++) {
        if (words[word] == null) {
            words.splice(word, 1);
            word--;
        }
    }

    edit.msg = words.join(" ");

    return edit;
}

const Message = require("discord.js").Message;

/**
 * @param {Message} msg 
 * @param {function(object):void} log
 */
let parse = function (msg, log) {

    //apply everything
    let content = applyReplacing(msg.content);

    let words = content.split(" ");
    /**
     * A list of appliers to deal with
     * @type {Applier[]}
     */
    let applying = [];
    for (let i in words) {
        applyGrouping(words[i], words.length, i, applying);
    }
    let edit = applyAppliers(applying, words);

    if(edit.msg == msg.content)
        return null;

    log("parsed message (id "+msg.id+")");

    return msg.edit(edit.msg, edit.options);
}

let load = function (data) {
    if (data.replacers != null) replacers = data.replacers;
    if (data.groups != null) groups = data.groups;
}

let save = function () {
    return { replacers, groups };
}

module.exports = new Parser("default", "The default parser; contains basic replace and group edit functionality", parse, save, load);