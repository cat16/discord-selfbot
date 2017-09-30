const { Command } = require("./commands/commands.js");
const Message = require("discord.js").Message;
const { getFiles } = require("./tools.js");

let prefix = "self.";

/**
 * @property {Command[]} commands - an array of all commands being used
 * @property {Resources} resources - the resources the bot has
 */
class CommandHandler {

    constructor() {
        /**
         * @type {Command[]}
         */
        this.commands = [];
        /**
         * @type {Resources}
         */
        this.resources = null;
    }

    /**
     * loads all commands from the directory specified
     * @param {String} directory 
     */
    loadCommands(directory) {
        for (let file of getFiles(directory)) {

            try {

                /**@type {Command[]} */
                let obj = require("./" + file);

                if (obj instanceof Array) {
                    for (let command of obj) {
                        if (command instanceof Command) {
                            if (command.args != null) {
                                for (let arg of command.args) {
                                    if (arg.options == null) arg.options = [];
                                }
                            }else{
                                command.args = [];
                            }
                            if(command.aliases == null){
                                command.aliases = [];
                            }
                            this.commands.push(command);
                        }
                    }
                }

            } catch (ex) {
                console.error(
                    "Could not load command from file '" + file.split("\\commands\\")[1] + "'!" +
                    "\n - " + ex.stack
                );

            }
        }

        console.log("found and loaded " + this.commands.length + " commands.");
    }

    /**
     * @param {Command} command 
     * @param {Message} msg
     * @param {String} text 
     */
    process(command, msg, text) {
        let args = {};
        for (let arg of command.args) {
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
                        options += "'" + arg.options[option] + "'";
                        if (i < arg.options.length - 1) options += ", "
                    }
                    msg.edit(msg.content +
                        "\n```Arguement Error: '" + text.split(" ")[0] + "' is not a valid option for '" + arg.name + "'." +
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
                    msg.edit(msg.content + "\n```Arguement Error: Not enough arguements were given```");
                    return;
                }
            }
        }
        args.extra = text;
        try {
            command.handle(msg, args, this.resources);
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

        if (text.startsWith(prefix)) {
            text = text.slice(prefix.length);

            commandLoop:
            for (let command of this.commands) {
                if (text.startsWith(command.name)) {
                    this.process(command, msg, text.slice(command.name.length + 1));
                    text = text.slice(command.name.length + 1);
                    break;
                } else {
                    for (let alias of command.aliases) {
                        if (text.startsWith(alias)) {
                            this.process(command, msg, text.splice(alias.length + 1));
                            break commandLoop;
                        }
                    }
                }
            }
        }

    }

}

module.exports.CommandHandler = CommandHandler;