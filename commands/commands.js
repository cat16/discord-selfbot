const { Message, TextChannel } = require("discord.js");
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
    constructor(name, options) {
        this.name = name;
        this.options = options;
    }
}

/**
 * An arguement for a command that must be a channel
 * @property {String} type
 */
let ChannelArg = class ChannelArg extends Arg {
    /**
     * 
     * @param {String} name 
     */
    constructor(name) {
        super(name);
        this.type = "channel";
    }
}

/**
 * An arguement for a command that must be a channel
 * @property {String} type
 */
let UserArg = class UserArg extends Arg {
    /**
     * 
     * @param {String} name 
     */
    constructor(name) {
        super(name);
        this.type = "user";
    }
}

/**
 * Sends a message formatted the "default" way. Use for simple info about what just happened
 * @param {String} msg 
 * @return {Promise<Message>|void}
 */
let respondForCommands = (msg) => { }

/**
 * Sends a message formatted the "default" way. Use for simple info about what just happened
 * @param {TextChannel} channel
 * @param {String} msg 
 * @return {Promise<Message>}
 */
let respond = (channel, msg, autoDelete) => {
    let promise = channel.send("self > " + msg);
    if (autoDelete == null ? false : autoDelete) {
        promise.then(msg2 => { msg2.delete(5000) });
        return promise;
    } else {
        return promise;
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
     * @param {function(respondForCommands, Message, object, Resources)} handleFunc
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
module.exports.ChannelArg = ChannelArg;
module.exports.UserArg = UserArg;
module.exports.Command = Command;
module.exports.respond = respond;