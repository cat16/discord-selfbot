const { RichEmbed } = require('discord.js');

const { Command } = require('../commands.js');
const util = require('util');

module.exports = class EvalCommand extends Command {

    constructor(bot) {
        super(bot, {
            name: "eval",
            description: "evaluates any javascript",
            aliases: ["test"]
        });
    }

    async run(msg, args) {

        let depth = 0;

        try {
            let evaled = eval(args.extra);
            let output = evaled;
            if (typeof (output) !== 'string') {
                output = util.inspect(output, { depth });
            }
            let type = typeof (evaled) === 'object' ? "object - " + evaled.constructor.name : typeof (evaled);
            let code = this.bot.tools.prepCode(output);
            let embed = new RichEmbed()
                .addField("Input", "```js\n" + args.extra + "```")
                .addField("Output", "```js\n" + code.slice(0, 1000) + "```")
                .addField("Type", "```js\n" + type + "```");

            if (code.length > 1000) {
                let hastebin = await this.bot.tools.hastebin(code, 'js');
                embed.setDescription(hastebin);
            }

            let sent = msg.channel.send("", { embed });
            if (output == "Promise { <pending> }") {
                evaled.then(async result => {
                    code = this.bot.tools.prepCode(util.inspect(result, { depth }));

                    let embed = new RichEmbed()
                        .addField("Input", "```js\n" + args.extra + "```")
                        .addField("Output", "```js\n" + code.slice(0, 1000) + "```")
                        .addField("Type", "```js\nobject - " + result.constructor.name + "```")

                    if (code.length > 1000) {
                        let hastebin = await this.bot.tools.hastebin(code, 'js');
                        embed.setDescription(hastebin);
                    }
                    sent.then(msg2 => {
                        msg2.edit("", { embed });
                    });
                });
            }
        } catch (ex) {
            let hastebin = await this.bot.tools.hastebin(ex.stack);
            let embed = new RichEmbed()
                .addField("Input", "```js\n" + args.extra + "```")
                .addField("Exception", "```js\n" + ex.message + "```")
                .addField("Type", "```js\n" + ex.name + "```")
                .setDescription("Full stack: " + hastebin)
            msg.channel.send("", { embed });
        }
    }
}