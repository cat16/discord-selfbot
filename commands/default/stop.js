const { Command } = require('../commands.js');

module.exports = class StopCommand extends Command {
    constructor(bot) {
        super(bot, {
            name: "stop",
            description: "stops the bot"
        })
    }

    run(msg, args){
        this.respond("shutting down...").then(() => {
            this.bot.save();
            process.exit(0);
        });
    }
}