const { Command, Arg } = require('../commands.js');

const fs = require('fs');

module.exports = class GetCodeCommand extends Command {
    constructor(bot) {
        super(bot, {
            name: "getCode",
            description: "lets you view this bot's code",
            args: [
                new Arg("file")
            ]
        })
    }

    run(msg, args){
        //Process code

        /**@type {string} */
        let code = "";
        try {
            code = fs.readFileSync(`${__dirname}/../../${args.file}`).toString();
        } catch (ex) {
            this.respond(`\`${args.file}\` does not exist or would not open`);
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
                segments[i] += this.bot.tools.prepCode(line + "\n");
            }
        }

        segments[i].trim();

        //Deal with reactions

        const pChain = this.bot.tools.promiseChain;

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
            this.bot.client.once('messageReactionRemove', re => {
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
                } else {
                    pChain(msg.react('❌'), [
                        waitForReaction.bind(null, index)
                    ]);
                }
            });
        }
        msg.channel.send("loading...").then(newMsg => {
            sendCode(newMsg, 0);
        });
    }
}