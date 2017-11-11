const { Command, Arg } = require('../commands.js');

module.exports = class DeleteResponsesCommand extends Command {
    constructor(bot) {
        super(bot, {
            name: "deleteResponses",
            description: "sets whether the bot should automatically delete responses using the response function",
            args: [
                new Arg("onoff", ["on", "off"])
            ]
        })
    }

    run(msg, args) {
        this.bot.commandhandler.state.deleteResponses = args.onoff === "on" ? true : false;
        this.respond("deleteResponses turned " + args.onoff);
    }
}