//lol ⬆ ⬇

const { Command, Arg } = require("./commands.js");
const { Message, MessageReaction, RichEmbed, Guild } = require("discord.js");

let commands = [
    new Command("ping", "gets the ping of this selfbot", null, (r, msg) => {
        let ping = new Date().getTime() - msg.createdTimestamp;
        msg.edit(msg.content + " > took `" + ping + "`ms");
    }),
    new Command("eval", "evaluates any javascript", ["test"], (r, msg, args, resources) => {
        try {
            let evaled = eval(args.extra);
            let output = evaled;
            let util = require('util');
            if (typeof (output) !== 'string') {
                output = util.inspect(output, { depth: 0 });
            }
            let type = typeof (evaled) === 'object' ? "object - " + evaled.constructor.name : typeof (evaled);
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
    new Command("prune", "deletes messages by you", null, (r, msg, args, resources) => {
        let i = parseInt(args.number) + 1;
        msg.channel.fetchMessages().then(msgs => {
            msgs.some(msgIn => {
                if (msgIn.author.id === resources.bot.user.id && i > 0) {
                    i--;
                    msgIn.delete();
                    return false;
                }
                return true;
            });
        });
    }, [new Arg("number")]),
    new Command("getCode", "WIP", null, (r, msg, args, resources) => {

        //Process code

        /**@type {string} */
        let code = "";
        try {
            code = fs.readFileSync(__dirname + "/../" + args.file).toString();
        } catch (ex) {
            r("`" + args.file + "` does not exist or would not open");
            return;
        }

        let SEG_LENGTH = 1900;

        /**@type {string[]} */
        let segments = [""];

        let lines = code.split("\r\n");
        let i = 0;
        for(let line of lines){
            if(segments[i].length + line.length > SEG_LENGTH){
                segments.push(line);
                i++;
            }else{
                segments[i] += resources.tools.prepCode(line + "\n");
            }
        }

        segments[i].trim();

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
                            reaction.message.edit("", { embed }).then(msg => {
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