const { Message } = require('discord.js');
const Selfbot = require('../selfbot.js');

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
    constructor(name, options = []) {
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
 * A command you can use
 */
let Command = class Command {

    /**
	 * @typedef {Object} CommandOptions
     * @property {string} name
     * @property {string} [description]
     * @property {string[]} [aliases]
     * @property {Arg[]} [args]
	 */

    /**
     * @param {Selfbot} bot
     * @param {Message} msg
     * @param {CommandOptions} options
     */
    constructor(bot, options) {
        this.bot = bot;

        this.name = options.name;
        this.description = options.description || 'a work-in-progress command';
        this.aliases = options.aliases || [];
        this.args = options.args || [];
    }

    /**
     * 
     * @param {Message} message
     * @param {object} args
	 * @abstract
	 */
    run(message, args) {
        throw new Error('A run method was not provided for this command');
    }

    /**
     * @param {Message} message 
     */
    prepare(message) {
        this._msg = message;
    }

    /**
     * @param {string} msg 
     * @return {Promise<Message>}
     */
    respond(msg) {
        return this.bot.respond(this._msg.channel, msg, this.bot.commandhandler.state.deleteResponses)
    }

}

module.exports.Arg = Arg;
module.exports.ChannelArg = ChannelArg;
module.exports.UserArg = UserArg;
module.exports.Command = Command;