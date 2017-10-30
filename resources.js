const { Client, TextChannel } = require('discord.js');
const { CommandHandler } = require("./command-handler.js");
const { ParserHandler } = require("./parser-handler.js");

/**
 * @property {Bot} bot - the bot client that is logged and being used
 * @property {CommandHandler} commandhandler - the bot's command handler
 * @property {ParserHandler} parserhandler - the bot's parser handler
 * @property {function():void} restart - a function that restarts the bot
 * @property {function():void} save - a function that saves everything the bot needs
 */
module.exports = class Resources {
    
    /**
     * @param {Client} bot 
     * @param {CommandHandler} commandhandler
     * @param {ParserHandler} parserhandler
     * @param {function():void} restart 
     * @param {function():void} save 
     */
    constructor(bot, commandhandler, parserhandler, restart, save){
        this.bot = bot;
        this.commandhandler = commandhandler;
        this.parserhandler = parserhandler;
        this.restart = restart;
        this.save = save;
        this.tools = require("./tools.js");
        this.config = require("./config.json");
    }

}