const { Command } = require('../commands.js');

module.exports = class RestartCommand extends Command {
    constructor(bot) {
        super(bot, {
            name: "restart",
            description: "restarts the bot"
        })
    }

    run(msg, args){
        this.respond("restarting...").then(msg2 => {
            this.bot.restart(msg2);
        });
    }
}