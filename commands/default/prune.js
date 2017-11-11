const { Command, Arg } = require('../commands.js');

module.exports = class PruneCommand extends Command {
    constructor(bot) {
        super(bot, {
            name: "prune",
            description: "deletes messages by you",
            args: [
                new Arg("number")
            ]
        })
    }

    run(msg, args){
        let i = parseInt(args.number);
        msg.channel.fetchMessages().then(msgs => {
            msgs.some(msgIn => {
                if (msgIn.author.id === this.bot.client.user.id) {
                    i--;
                    msgIn.delete();
                }
                if (i > 0) return false;
                return true;
            });
        });
    }
}