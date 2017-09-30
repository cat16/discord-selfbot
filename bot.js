console.log("loading...");



const Discord = require("discord.js");
const Bot = Discord.Client;
const TextChannel = Discord.TextChannel;
const cycle = require('cycle');

const config = require("./config.json");
const Tools = require("./tools.js");
const ParserHandler = require("./parser-handler.js").ParserHandler;
const CommandHandler = require("./command-handler.js").CommandHandler;
const Resources = require("./resources.js");

let bot = new Discord.Client();
let parserhandler = new ParserHandler();
let commandhandler = new CommandHandler();

/**
 * saves the bot's state
 */
let save = function () {
    console.log("Saving...");
    if (parserhandler != null) parserhandler.save();
    console.log("Saved.");
}

/**
 * @param {TextChannel} channel
 * @return {never}
 */
let restart = (channel) => {
    channel.send("self > restarting...").then(() => {
        save();
        Tools.hold("restartChannel", channel.id);
        process.exit(100);
    });
}

/**@type {Resources} */
resources = {
    /**The Discord client logged in and being used */
    bot,
    /**The parsers loaded */
    parsers: parserhandler.parsers,
    /**The commands loaded */
    commands: commandhandler.commands,
    /**restarts the bot (reloads all files but main.js)*/
    restart,
    /**saves the bot (completely) */
    save,
    /**The bot's tools (utility functions and such) */
    tools: Tools
}

parserhandler.resources = resources;
commandhandler.resources = resources;
parserhandler.loadParsers("/parsers");
commandhandler.loadCommands("/commands");

bot.on("ready", () => {
    console.log("connected - bot ready");
    process.stdin.resume();

    Tools.release("restartChannel").then(chId => {
        if (chId !== "NO_DATA") {
            bot.channels.some(channel => {
                if (channel instanceof TextChannel) {
                    if (channel.id == chId.slice(1, -1)) {
                        channel.send("self > succesfully restarted");
                        return true;
                    }
                }
                return false;
            })
        }
    });

    //bot.user.setPresence({ status: 'online', game: { name: "selfbot", type: 0 } });
});

bot.on("message", msg => {
    if (msg.author.id != bot.user.id) return;

    parserhandler.parse(msg).then(parsedMsg => {
        commandhandler.handle(parsedMsg);
    })
});

console.log("connecting...");
bot.login(config.token);

process.on('message', m => {
    if(m === "EXIT"){
        save();
        process.exit(0);
    }
});

process.on('unhandledRejection', (reason, p) => {
    console.error('Unhandled Rejection at: Promise', p, 'reason:', reason);
});