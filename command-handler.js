const { Command, respond } = require("./commands/commands.js");
const Message = require("discord.js").Message;
const { getFiles, getDirectories, load, save, classExtends } = require("./tools.js");
const Selfbot = require('./selfbot.js');

class CommandHandlerState {
    constructor() {
        this.deleteResponses = false;
        this.deleteCommands = false;
        this.prefixes = ["self.", "s.", "self < "];
    }
}

class CommandHandler {

    constructor() {
        /**
         * @type {Command[]}
         */
        this.commands = [];
        /**@type {CommandHandlerState} */
        this.state = Object.assign(new CommandHandlerState(), load("commands"));
    }

    /**
     * loads all commands from the directory specified
     * @param {String} directory 
     * @param {Selfbot} bot
     */
    loadCommands(directory, bot) {
        for (let directory2 of getDirectories(directory)) {
            this.loadCommands(`${directory}/${directory2}`, bot);
        }
        for (let file of getFiles(directory)) {

            if (file.endsWith('.js')) {

                try {

                    /**@type {function() : Command} */
                    let commandClass = require(`${directory}/${file}`);

                    if (classExtends(commandClass, Command)) {
                        this.commands.push(new commandClass(bot));
                    }

                } catch (ex) {
                    console.error(
                        `Could not load command from '${file}'!` +
                        "\n - " + ex.stack
                    );
                }
            }
        }
    }

    /**
     * @param {Command} command 
     * @param {Message} msg
     * @param {String} text
     */
    process(command, msg, text) {

        let args = {};
        let currentChannel = 0;
        let currentUser = 0;
        for (let arg of command.args) {
            if (arg.type != null) {
                switch (arg.type) {
                    case "channel": {
                        let arr = msg.mentions.channels.array();
                        if (arr.length > currentChannel) {
                            args[arg.name] = arr[currentChannel];
                            currentChannel++;
                            text = text.replace(/^<#.+>/, '');
                            text = text.trim();
                        } else {
                            msg.channel.send("```Arguement Error: no channel was given```");
                        }
                        break;
                    }
                    case "user": {
                        let arr = msg.mentions.users.array();
                        if (arr.length > currentUser) {
                            args[arg.name] = arr[currentUser];
                            currentUser++;
                            text = text.replace(/^<@.+>/, '');
                            text = text.trim();
                        } else {
                            msg.channel.send("```Arguement Error: no user was given```");
                        }
                        break;
                    }
                    default:
                        msg.channel.send("```Error: command is invalid due to arg type for " + arg.name + "```");
                        break;
                }
            } else {
                if (arg.options.length > 0) {
                    let optionChosen = false;
                    for (let option of arg.options) {
                        if (text.startsWith(option)) {
                            args[arg.name] = text.slice(0, option.length);
                            text = text.slice(option.length + 1);

                            optionChosen = true;
                        }
                    }
                    if (!optionChosen) {
                        let options = "";
                        for (let i = 0; i < arg.options.length; i++) {
                            options += "'" + arg.options[i] + "'";
                            if (i < arg.options.length - 1) options += ", "
                        }
                        msg.channel.send(
                            "```Arguement Error: '" + text.split(" ")[0] + "' is not a valid option for '" + arg.name + "'." +
                            "\n - Valid options: " + options + "```"
                        );

                        return;
                    }
                } else {
                    if (text.length > 0) {
                        let words = text.split(" ");
                        args[arg.name] = words.shift();
                        text = words.join(" ");
                    } else {
                        msg.channel.send("```Arguement Error: Not enough arguements were given```");
                        return;
                    }
                }
            }
        }
        args.extra = text;
        try {
            command.prepare(msg);
            command.run(msg, args);
            console.log("[command-handler] successfully ran command '" + command.name + "'");
        } catch (ex) {
            console.error(
                "Command '" + command.name + "' crashed!" +
                "\n - " + ex.stack
            );
        }
    }

    /**
     * @param {Message} msg 
     */
    handle(msg) {

        let text = msg.content;

        for (let prefix of this.state.prefixes) {
            if (text.toLocaleLowerCase().startsWith(prefix)) {
                text = text.slice(prefix.length);

                commandLoop:
                for (let command of this.commands) {
                    if (text.toLocaleLowerCase().startsWith(command.name.toLocaleLowerCase())) {
                        //if command is found
                        if (this.state.deleteCommands) {
                            msg.delete().then(delMsg => {
                                this.process(command, delMsg, text.slice(command.name.length + 1));
                            });
                        } else this.process(command, msg, text.slice(command.name.length + 1));

                        break;
                    } else {
                        for (let alias of command.aliases) {
                            if (text.toLocaleLowerCase().startsWith(alias.toLocaleLowerCase())) {
                                //if command is found
                                if (this.state.deleteCommands) {
                                    msg.delete().then(delMsg => {
                                        this.process(command, delMsg, text.slice(alias.length + 1));
                                    });
                                } else this.process(command, msg, text.slice(alias.length + 1));

                                break commandLoop;
                            }
                        }
                    }
                }
                break;
            }
        }

    }

    /**
     * Saves the command handler's state
     */
    save() {
        save("commands", this.state);
    }

}

module.exports.CommandHandler = CommandHandler;