console.log("loading...");



const Discord = require("discord.js");
const Bot = Discord.Client;
const TextChannel = Discord.TextChannel;
const Message = Discord.Message;
const cycle = require('cycle');

const config = require("./config.json");
const Tools = require("./tools.js");
const ParserHandler = require("./parser-handler.js").ParserHandler;
const CommandHandler = require("./command-handler.js").CommandHandler;
const Resources = require("./resources.js");
const { respond } = require("./commands/commands.js");

let bot = new Discord.Client();
let parserhandler = new ParserHandler();
let commandhandler = new CommandHandler();

/**
 * saves the bot's state
 */
let save = function () {
    console.log("saving...");
    if (parserhandler != null) parserhandler.save();
    if (commandhandler != null) commandhandler.save();
    console.log("saved.");
}

/**
 * @param {TextChannel|Message} channelmsg - the channel you want to notify once restarted, or the message which will be edited
 * @param {boolean} save2 - whether to save when restarting
 * @return {never}
 */
let restart = (channelmsg, save2) => {
    if (save2 == null) save2 = true;

    if (save2) save();
    if (channelmsg instanceof Message) {
        Tools.hold("restartMessage", channelmsg.id);
        Tools.hold("restartChannel", channelmsg.channel.id);
    }
    if (channelmsg instanceof TextChannel) Tools.hold("restartChannel", channelmsg.id);
    process.exit(100);
}

parserhandler.loadParsers("/parsers");
commandhandler.loadCommands("/commands");

let resources = new Resources(bot, commandhandler, parserhandler, restart, save, Tools);

parserhandler.resources = resources;
commandhandler.resources = resources;

bot.on("ready", () => {
    console.log("successfully connected as '" + bot.user.username + "'");
    process.stdin.resume();

    /**@type {TextChannel} */
    let msgChannel = null;

    Tools.release("restartChannel").then(chId => {
        process.send("READY");
        if (chId !== "NO_DATA") {
            bot.channels.some(channel => {
                if (channel instanceof TextChannel) {
                    if (channel.id == chId.slice(1, -1)) {
                        msgChannel = channel;
                        respond(channel, "succesfully restarted", commandhandler.state.deleteResponses);
                        return true;
                    }
                }
                return false;
            })
        }
        if (msgChannel != null && commandhandler.state.deleteResponses) {
            Tools.release("restartMessage").then(msgId => {
                msgChannel.fetchMessage(msgId.slice(1, -1)).then(msg => {
                    msg.delete(1000);
                });
            });
        }
    });

    //bot.user.setPresence({ status: 'online', game: { name: "selfbot", type: 0 } });
});

bot.on("message", msg => {
    if (msg.author.id != bot.user.id) return;

    parserhandler.parse(msg).then(parsedMsg => {
        commandhandler.handle(parsedMsg);
    });
});

console.log("connecting...");
bot.login(config.token);

process.on('message', m => {
    if (m === "EXIT") {
        save();
        process.exit(0);
    }
});

process.on('unhandledRejection', (reason, p) => {
    console.error('Unhandled Rejection at: Promise', p, 'reason:', reason);
});