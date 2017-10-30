const fs = require('fs');
const { Command, Arg, UserArg } = require("./commands.js");
const { Message, MessageReaction, RichEmbed, Guild, User } = require("discord.js");

let commands = [
    new Command("ping", "gets the ping of this selfbot", null, (r, msg, args, rsc) => {
        r("took `" + rsc.bot.ping + "`ms");
    }),
    new Command("eval", "evaluates any javascript", ["test"], (r, msg, args, rsc) => {
        try {
            let evaled = eval(args.extra);
            let output = evaled;
            let util = require('util');
            if (typeof (output) !== 'string') {
                output = util.inspect(output, { depth: 0 });
            }
            let type = typeof (evaled) === 'object' ? "object - " + evaled.constructor.name : typeof (evaled);
            let sent = msg.channel.send("", {
                embed: new RichEmbed()
                    .addField("Input", "```js\n" + msg.content + "```")
                    .addField("Output", "```js\n" + rsc.tools.prepCode(output).slice(0, 1000) + "```")
                    .addField("Type", "```js\n" + type + "```")
            });
            if (output == "Promise { <pending> }") {
                evaled.then(result => {
                    sent.then(msg2 => {
                        msg2.edit("", {
                            embed: new RichEmbed()
                                .addField("Input", "```js\n" + msg.content + "```")
                                .addField("Output", "```js\n" + rsc.tools.prepCode(util.inspect(result, { depth: 0 })).slice(0, 1000) + "```")
                                .addField("Type", "```js\nobject - " + result.constructor.name + "```")
                        });
                    });
                });
            }
        } catch (ex) {
            msg.channel.send("", { embed: new RichEmbed()
                .addField("Input", "```js\n" + args.extra + "```")
                .addField("Exception", "```js\n" + ex.message + "```")
                .addField("Type", "```js\n" + ex.name + "```")
            });
        }
    }),
    new Command("prune", "deletes messages by you", null, (r, msg, args, rsc) => {
        let i = parseInt(args.number) + 1;
        msg.channel.fetchMessages().then(msgs => {
            msgs.some(msgIn => {
                if (msgIn.author.id === rsc.bot.user.id) {
                    i--;
                    msgIn.delete();
                }
                if(i > 0) return false;
                return true;
            });
        });
    }, [new Arg("number")]),
    new Command("getProfilePic", "gets the link to someone's profile picture", ["getPic"], (r, msg, args) => {
        /**@type {User} */
        let user = args.user;
        msg.channel.send(user.username + "'s profile picture link: " + user.displayAvatarURL);
    }, [new UserArg("user")]),
    new Command("getCode", "lets you view this bot's code", null, (r, msg, args, rsc) => {

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
        for (let line of lines) {
            if (segments[i].length + line.length > SEG_LENGTH) {
                segments.push(line);
                i++;
            } else {
                segments[i] += rsc.tools.prepCode(line + "\n");
            }
        }

        segments[i].trim();

        //Deal with reactions

        const pChain = rsc.tools.promiseChain;

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
            rsc.bot.once('messageReactionRemove', re => {
                /**@type {MessageReaction} */
                let reaction = re;
                if (reaction.message.id == msgr.message.id && !reaction.me) {
                    switch (reaction.emoji.toString()) {
                        case "❌":
                            reaction.message.delete();
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
            msg.edit("code for `" + args.file + "`:```js\n" + segments[index] + "```").then(msg => {
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
        msg.channel.send("loading...").then(newMsg => {
            sendCode(newMsg, 0);
        });
    }, [new Arg("file")])
];

module.exports = commands;