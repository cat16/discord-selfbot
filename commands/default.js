//lol ⬆ ⬇

const { Command, Arg } = require("./commands.js");
const { Message, MessageReaction, RichEmbed, Guild } = require("discord.js");

const fs = require('fs');

let commands = [
    new Command("ping", "gets the ping of this selfbot", null, (msg) => {
        let ping = new Date().getTime() - msg.createdTimestamp;
        msg.edit(msg.content + " - took `" + ping + "`ms");
    }),
    new Command("eval", "evaluates any javascript", ["test"], (msg, args, resources) => {
        try {
            let evaled = eval(args.extra);
            let output = evaled;
            let util = require('util');
            if (typeof (output) !== 'string') {
                output = util.inspect(output, { depth: 0 });
            }
            let type = typeof (evaled) == 'object' ? "object - " + evaled.constructor.name : typeof (evaled);
            let sent = msg.edit(msg.content, {
                embed: new RichEmbed()
                    .addField("Output", "```js\n" + resources.tools.prepCode(output) + "```")
                    .addField("Type", "```js\n" + type + "```")
            });
            if (output == "Promise { <pending> }") {
                evaled.then(result => {
                    sent.then(msg => {
                        msg.edit(msg.content, {
                            embed: new RichEmbed()
                                .addField("Output", "```js\n" + resources.tools.prepCode(util.inspect(result, { depth: 0 }).slice(0, 1750)) + "```")
                                .addField("Type", "```js\nobject - " + result.constructor.name + "```")
                        });
                    });
                });
            }
        } catch (ex) {
            msg.edit("", { embed: new RichEmbed().setDescription(": Input :```js\n" + args.extra + "```\n: Exception :```js\n" + ex.message + "```: Type :```js\n" + ex.name + "```") });
        }
    }),
    new Command("restart", "restarts the bot", null, (msg, args, resources) => {
        resources.restart(msg.channel);
    }),
    new Command("stop", "stops the bot", null, (msg) => {
        msg.channel.send("self > shutting down...").then(() => {
            resources.save();
            process.exit(0);
        });
    }),
    new Command("getCode", "WIP", null, (msg, args, resources) => {

        //Process code

        /**@type {string} */
        let code = "";
        try {
            code = fs.readFileSync(__dirname + "/../" + args.file).toString();
        } catch (ex) {
            msg.channel.send("`" + args.file + "` does not exist or would not open");
        }
        /**@type {string[]} */
        let segments = [];
        for (let i = 0; i < code.length / 1900; i++) {
            segments.push(resources.tools.prepCode(
                code.substring(i * 1900, (i * 1900) + 1900)
            ));
        }

        //Deal with reactions

        const pChain = resources.tools.promiseChain;

        /**
         * @param {string} symbol 
         */
        let react = (symbol) => {
            /**@type {function(MessageReaction): Promise<MessageReaction>} */
            let func = (reaction) => { return reaction.message.react(symbol) }
            return func;
        }

        /**
         * @param {MessageReaction} msgr 
         * @param {number} index 
         */
        let waitForReaction = (index, msgr) => {
            resources.bot.once('messageReactionRemove', re => {
                /**@type {MessageReaction} */
                let reaction = re;
                if (reaction.message.id == msgr.message.id && !reaction.me) {
                    switch (reaction.emoji.toString()) {
                        case "❌":
                            let embed = new RichEmbed()
                                .setTitle("code for `" + args.file + "`:")
                                .setDescription("[CANCLED]");
                            reaction.message.edit("", {embed}).then(msg => {
                                msg.clearReactions();
                            })
                            break;
                        case "⬇":
                            sendCode(reaction.message, index + 1);
                            break;
                        case "⬆":
                            sendCode(reaction.message, index - 1);
                            break;
                    }
                }
            })
        }
        /**
         * @param {Message} msg 
         * @param {number} index 
         */
        let sendCode = (msg, index) => {
            let embed = new RichEmbed()
                .setTitle("code for `" + args.file + "`:")
                .setDescription("```js\n" + segments[index] + "```")
            msg.edit(" ", { embed }).then(msg => {
                if (segments.length > 1) {
                    if (index == 0) {
                        pChain(msg.react("❌"), [
                            react("⬇"),
                            waitForReaction.bind(null, index)
                        ]);
                    } else if (index == segments.length - 1) {
                        pChain(msg.react("❌"), [
                            react("⬆"),
                            waitForReaction.bind(null, index)
                        ]);
                    } else {
                        pChain(msg.react("❌"), [
                            react("⬇"),
                            react("⬆"),
                            waitForReaction.bind(null, index)
                        ]);
                    }
                }
            });
        }
        sendCode(msg, 0);
    }, [new Arg("file")])
];

module.exports = commands;