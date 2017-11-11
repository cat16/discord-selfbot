let { Parser, MsgEdit } = require('./parsing.js');
let { RichEmbed } = require('discord.js');

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
     * @param {function(string, object): string} applyFunc 
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

/**
 * The list of replacers
 * @type {Replacer[]}
*/
let replacers = [];

/**
 * The list of group appliers
 * @type {GroupApplier[]}
 * */
let groups = [];

let options = {
    /**options for group appliers */
    grouping: {
        /**The string that starts groups */
        groupStart: '[',
        /**The string that ends groups */
        groupEnd: ']',
        /**The string that terminates groups */
        groupTerminator: '/',
        /**The seperator for arguements in groups */
        argSeperator: ','
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
 * @param {string} msg
 * @return {string}
 */
let applyGrouping = function (msg) {

    const start = options.grouping.groupStart;
    const end = options.grouping.groupEnd;
    const term = options.grouping.groupTerminator;
    const sep = options.grouping.argSeperator;

    for (let group of groups) {
        for (let key of group.keys) {
            let startRegex = (start + key + '.*' + end + '.*').replace(/\]/g, '\\]').replace(/\[/g, '\\[');
            let mainRegex = startRegex + ((start + term + key + end).replace(/\]/g, '\\]').replace(/\[/g, '\\['));
            let matches = msg.match(new RegExp(mainRegex, 'g'));
            if (matches != null) {
                for (let match of matches) {
                    let args = {};
                    let argsString = match
                        .substring(start.length + key.length, match.indexOf(end))
                    if (argsString.length > 0) {
                        argsString.substring(sep.length).split(sep).forEach(value => {
                            args[value.substring(sep.length - 1, value.indexOf('='))] = value.substring(value.indexOf('=') + 1);
                        });
                    }
                    let grouperLength = start.length + key.length + end.length;
                    let content = match.substring(grouperLength + argsString.length, match.length - (grouperLength + term.length));
                    let replace = group.apply(content, args);
                    msg = msg.replace(match, replace);
                }
            }
            matches = msg.match(new RegExp(startRegex));
            if (matches != null) {
                let match = matches[0];
                let args = {};
                let argsString = match
                    .substring(start.length + key.length, match.indexOf(end))
                if (argsString.length > 0) {
                    argsString.substring(sep.length).split(sep).forEach(value => {
                        args[value.substring(sep.length - 1, value.indexOf('='))] = value.substring(value.indexOf('=') + 1);
                    });
                }
                let grouperLength = start.length + key.length + end.length;
                let content = match.substring(grouperLength + argsString.length);
                let replace = group.apply(content, args);
                msg = msg.replace(match, replace);
            }
        }
    }

    return msg;
}

const Message = require('discord.js').Message;

/**
 * @param {Message} msg 
 * @param {function(object):void} log
 */
let parse = function (msg, log) {

    //apply everything
    let edit = applyGrouping(applyReplacing(msg.content));

    if (edit == msg.content)
        return null;

    log('parsed message (id ' + msg.id + ')');

    return msg.edit(edit);
}

let load = function (data) {
    if (data.replacers != null) replacers = data.replacers;
    else replacers = [
        new Replacer(['(lenny)'], '( ͡° ͜ʖ ͡°)'),
        new Replacer(['(tm)'], '™')
    ];
    if (data.groups != null) groups = data.groups;
    else groups = [
        new GroupApplier(
            ['long'],
            (text, args) => {
                let spaces = '   ';
                if (args.spaces != null) {
                    for (let i = 0; i < args.spaces; i++) {
                        spaces += ' ';
                    }
                }
                text = text.split(' ').join(spaces);
                return text.split('').join(spaces);
            }
        ),

        new GroupApplier(
            ['convert'],
            (text, args) => {
                switch (args.to) {
                    case "hex": {
                        let hexes = [];
                        for (i=0; i<text.length; i++) {
                            hexes.push("0x"+Number(text.charCodeAt(i)).toString(16));
                        }
                    
                        return hexes.join('');
                        break;
                    }
                    case "binary": {
                        let binaries = [];
                        for (var i = 0; i < text.length; i++) {
                            let binary = Number(text.charCodeAt(i)).toString(2);
                            let needed = 8 - binary.length;
                            for(let i = 0; i < needed; i++){
                                binary = "0"+binary;
                            }
                            binaries.push(binary);
                        }
                        return binaries.join('');
                        break;
                    }
                    default: {
                        let decimals = [];
                        for (var i = 0; i < text.length; i++) {
                            let decimal = text.charCodeAt(i);
                            decimals.push(decimal.toString());
                        }
                        return decimals.join('');
                        break;
                    }
                }
                return "ERROR";
            }
        ),
        new GroupApplier(
            ['pinyin'],
            (text, args) => {
                let replace = {
                    'a1': 'ā',
                    'a2': 'á',
                    'a3': 'ǎ',
                    'a4': 'à',
                    'e1': 'ē',
                    'e2': 'é',
                    'e3': 'ě',
                    'e4': 'è',
                    'i1': 'ī',
                    'i2': 'í',
                    'i3': 'ǐ',
                    'i4': 'ì',
                    'o1': 'ō',
                    'o2': 'ó',
                    'o3': 'ǒ',
                    'o4': 'ò',
                    'u1': 'ū',
                    'u2': 'ú',
                    'u3': 'ǔ',
                    'u4': 'ù'
                }
                for(let r in replace){
                    text = text.replace(new RegExp(r, 'g'), replace[r]);
                }
                return text;
            }
        )
    ];
}

let save = function () {
    return { replacers, groups };
}

module.exports = new Parser('default', 'The default parser; contains basic replace and group edit functionality', parse, save, load);