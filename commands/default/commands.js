const { Command } = require('../commands.js');

module.exports = class CommandsCommand extends Command {
    constructor(bot) {
        super(bot, {
            name: "commands",
            description: "gets a list of all commands"
        })
    }

    run(msg, args){
        msg.channel.send("", {
            embed: this.bot.tools.embedList("commands", this.bot.commandhandler.commands,
                cmd => { return "**" + cmd.name + "** - " + cmd.description },
                -4)
        });
    }
}