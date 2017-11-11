const { Command, Arg } = require('../commands.js');

module.exports = class DeleteCommandsCommand extends Command {
    constructor(bot) {
        super(bot, {
            name: "deleteCommands",
            description: "sets whether the bot should automatically delete the message that activated the command",
            args: [
                new Arg("onoff", ["on", "off"])
            ]
        })
    }

    run(msg, args){
        this.bot.commandhandler.state.deleteCommands = args.onoff === "on" ? true : false;
        this.respond("deleteCommands turned " + args.onoff);
    }
}