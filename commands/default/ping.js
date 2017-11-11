const { Command } = require('../commands.js');

module.exports = class PingCommand extends Command {
    constructor(bot) {
        super(bot, {
            name: "ping",
            description: "gets the ping of this selfbot"
        })
    }

    run(msg, args){
        this.respond(`Client ping: \`${this.bot.client.ping}\`ms`)
    }
}