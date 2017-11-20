const { Attachment } = require('discord.js');
const { Command } = require('../commands.js');

module.exports = class WinkCommand extends Command {
    constructor(bot) {
        super(bot, {
            name: "wink",
            description: "displays a huge elongated wink image"
        })
    }

    /**
     * @param {Message} msg
     */
    run(msg, args){
        msg.channel.send(new Attachment('./images/fatwink.png'));
    }
}