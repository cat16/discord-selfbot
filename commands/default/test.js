const { Message, Attachment } = require('discord.js');

const { Command } = require('../commands.js');

module.exports = class TestCommand extends Command {
    constructor(bot) {
        super(bot, {
            name: "test",
            description: "A test command to prepare an actual command"
        })
    }

    /**
     * @param {Message} msg
     */
    run(msg, args){
        msg.channel.send(new Attachment('./images/fatjoy.png'));
    }
}