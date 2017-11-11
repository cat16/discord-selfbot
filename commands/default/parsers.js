const { Command } = require('../commands.js');

module.exports = class ParsersCommand extends Command {
    constructor(bot) {
        super(bot, {
            name: "parsers",
            description: "gets a list of all parsers"
        })
    }

    run(msg, args){
        msg.channel.send("", {
            embed: this.bot.tools.embedList("parsers", this.bot.parserhandler.parsers,
                parser => { return "**" + parser.name + "** - " + parser.description },
            )
        });
    }
}