const { Command, Arg } = require('../commands.js');

module.exports = class ReloadCommand extends Command {
    constructor(bot) {
        super(bot, {
            name: "reload",
            description: "reloads a command (yet to come) or parser so you don't have to restart the bot",
            args: [
                new Arg("cmdparser", ["parser"])
            ]
        })
    }

    run(msg, args){
        switch(args.cmdparser){
            case "parser":
            let name = args.extra;
            if(this.bot.parserhandler.resetParserData(name)){
                this.respond("successfully reloaded parser '"+name+"'");
            }else{
                this.respond("could not find parser '"+name+"'")
            }
            break;
        }
    }
}