const { Command } = require('../commands.js');
const fs = require('fs');

module.exports = class ResetCommand extends Command {
    constructor(bot) {
        super(bot, {
            name: "reset",
            description: "deletes the bot's state which resets everything",
            aliases: ["deleteState"]
        })
    }

    run(msg, args){
        fs.stat(__dirname + "/../../state.json", (err, stats) => {
            if (err) {
                r("The state file could not be accessed");
                return;
            }

            fs.unlink(__dirname + '/../../state.json', (err) => {
                if (err) {
                    console.log(err);
                    r("The state file could not be deleted");
                    return;
                } else {
                    r("State file deleted.");
                    this.bot.restart(msg.channel, false);
                }
            });
        });
    }
}