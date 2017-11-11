const discord = require('discord.js');
const { TextChannel, Message } = discord;
const { CommandHandler } = require('./command-handler.js');
const { ParserHandler } = require('./parser-handler.js');

module.exports = class Selfbot {

    constructor() {
        this.client = new discord.Client();
        this.commandhandler = new CommandHandler();
        this.parserhandler = new ParserHandler();
        this.tools = require('./tools.js');
        this.config = require('./config.json');

        this.client.on("ready", () => {
            console.log("successfully connected as '" + this.client.user.username + "'");
            process.stdin.resume();

            /**@type {TextChannel} */
            let msgChannel = null;

            this.tools.release("restartChannel").then(chId => {
                process.send("READY");
                if (chId !== "NO_DATA") {
                    this.client.channels.some(channel => {
                        if (channel instanceof TextChannel) {
                            if (channel.id == chId.slice(1, -1)) {
                                msgChannel = channel;
                                this.respond(channel, "succesfully restarted", this.commandhandler.state.deleteResponses);
                                return true;
                            }
                        }
                        return false;
                    })
                }
                if (msgChannel != null && this.commandhandler.state.deleteResponses) {
                    this.tools.release("restartMessage").then(msgId => {
                        msgChannel.fetchMessage(msgId.slice(1, -1)).then(msg => {
                            msg.delete(1000);
                        });
                    });
                }
            });

            //bot.user.setPresence({ status: 'online', game: { name: "selfbot", type: 0 } });
        });

        this.client.on("message", msg => {
            if (msg.author.id != this.client.user.id) return;
            this.parserhandler.parse(msg).then(parsedMsg => {
                this.commandhandler.handle(parsedMsg);
            });
        });
    }

    load() {
        this.parserhandler.loadParsers("./parsers");
        this.commandhandler.loadCommands("./commands", this);
        console.log("found and loaded " + this.commandhandler.commands.length + " commands.");

        console.log("connecting...");
        this.client.login(this.config.token);
    }

    /**
     * @param {TextChannel|Message} channelmsg - the channel you want to notify once restarted, or the message which will be edited
     * @param {boolean} save2 - whether to save when restarting
     * @return {never}
     */
    restart(channelmsg, save2) {
        if (save2 == null) save2 = true;

        if (save2) this.save();
        if (channelmsg instanceof Message) {
            this.tools.hold("restartMessage", channelmsg.id);
            this.tools.hold("restartChannel", channelmsg.channel.id);
        }
        if (channelmsg instanceof TextChannel) Tools.hold("restartChannel", channelmsg.id);
        process.exit(100);
    }

    /**
     * saves the bot's state
     */
    save() {
        console.log("saving...");
        if (this.parserhandler != null) this.parserhandler.save();
        if (this.commandhandler != null) this.commandhandler.save();
        console.log("saved.");
    }

    /**
     * Sends a message formatted the "default" way. Use for simple info about what just happened
     * @param {TextChannel} channel
     * @param {String} msg 
     * @return {Promise<Message>}
    */
    respond(channel, msg, autoDelete) {
        let promise = channel.send("self > " + msg);
        if (autoDelete == null ? false : autoDelete) {
            promise.then(msg2 => { msg2.delete(5000) });
            return promise;
        } else {
            return promise;
        }
    }
}