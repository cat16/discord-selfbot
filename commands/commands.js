const { Message } = require("discord.js");
const Resources = require("../resources.js");

/**
 * An arguement for a command
 * @property {String} name 
 * @property {String[]} options 
 */
let Arg = class Arg {

    /**
     * 
     * @param {String} name 
     * @param {String[]} [options] 
     */
    constructor(name, aliases, options){
        this.name = name;
        this.options = options;
    }

}

/**
 * A command you can use
 * @property {String} name - the name of the command
 * @property {String} description - basic info about what the command does
 * @property {String[]} aliases
 * @property {function(Message, object)} handle - the function that will be called when the command is successfully recieved
 * @property {Arg[]} args - An array of 'Arg's that will be used to make the handle function easier and more formal 
 */
let Command = class Command {

    /**
     * @param {String} name 
     * @param {String} description 
     * @param {String[]} [aliases]
     * @param {function(Message, object, Resources)} handleFunc 
     * @param {Arg[]} args 
     */
    constructor(name, description, aliases, handleFunc, args) {
        this.name = name;
        this.description = description;
        this.aliases = aliases;
        this.handle = handleFunc;
        this.args = args;
    }

}

module.exports.Arg = Arg;
module.exports.Command = Command;