const Bot = require('discord.js').Client
const { Command } = require("./commands/commands.js");
const { Parser } = require("./parsers/parsing.js");

/**
 * @property {Bot} bot - the bot client that is logged and being used
 * @property {Command[]} commands - an array of all commands being used
 * @property {Parser[]} parsers - an array of all parsers being used
 * @property {function():void} restart - a function that restarts the bot
 * @property {function():void} save - a function that saves everything the bot needs
 */
module.exports = class Resources {
    
    constructor(){
        /**@type {Bot} */
        this.bot = null;
        /**@type {Command[]} */
        this.commands = null;
        /**@type {Parser[]} */
        this.parsers = null;
        /**@type {function():void} */
        this.restart = null;
        /**@type {function():void} */
        this.save = null;
        this.tools = require("./tools.js");
    }

}