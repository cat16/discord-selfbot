const { Attachment } = require('discord.js');
const { Command } = require('../commands.js');

module.exports = class JoyCommand extends Command {
    constructor(bot) {
        super(bot, {
            name: "joy",
            description: "displays a huge joy image"
        })
    }

    /**
     * @param {Message} msg
     */
    run(msg, args){
        msg.channel.send(new Attachment('./images/joy.png'));
    }
}