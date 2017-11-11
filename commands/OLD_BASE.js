const { Command, Arg } = require("./commands.js");
const fs = require('fs');

let commands = [
    new Command("commands", "gets a list of all commands", null, (r, msg, args, rsc) => {
        msg.channel.send("", {
            embed: rsc.tools.embedList("commands", rsc.commandhandler.commands,
                cmd => { return "**" + cmd.name + "** - " + cmd.description },
                -4)
        });
    }),
    new Command("parsers", "gets a list of all parsers", null, (r, msg, args, rsc) => {
        msg.channel.send("", {
            embed: rsc.tools.embedList("parsers", rsc.parserhandler.parsers,
                parser => { return "**" + parser.name + "** - " + parser.description },
            )
        });
    }),
    new Command("reset", "deletes the bot's state which resets everything", ["deleteState"], (r, msg, args, rsc) => {
        fs.stat(__dirname + "/../state.json", function (err, stats) {
            if (err) {
                r("The state file could not be accessed");
                return;
            }

            fs.unlink(__dirname + '/../state.json', function (err) {
                if (err) {
                    console.log(err);
                    r("The state file could not be deleted");
                    return;
                } else {
                    r("State file deleted.");
                    rsc.restart(msg.channel, false);
                }
            });
        });
    }),
    new Command("restart", "restarts the bot", null, (r, msg, args, resources) => {
        r("restarting...").then(msg2 => {
            resources.restart(msg2);
        });
    }),
    new Command("stop", "stops the bot", null, (r, msg, args, rsc) => {
        r("shutting down...").then(() => {
            rsc.save();
            process.exit(0);
        });
    }),
    new Command("deleteResponses", "sets whether the bot should automatically delete responses using the response function", null, (r, msg, args, rsc) => {
        rsc.commandhandler.state.deleteResponses = args.onoff === "on" ? true : false;
        r("deleteResponses turned " + args.onoff);
    }, [new Arg("onoff", ["on", "off"])]),
    new Command("deleteCommands", "sets whether the bot should automatically delete the message that activated the command", null, (r, msg, args, rsc) => {
        rsc.commandhandler.state.deleteCommands = args.onoff === "on" ? true : false;
        r("deleteCommands turned " + args.onoff);
    }, [new Arg("onoff", ["on", "off"])]),
    new Command("reload", "reloads a command (yet to come) or parser so you don't have to restart the bot", null, (r, msg, args, rsc) => {
        switch(args.cmdparser){
            case "parser":
            let name = args.extra;
            if(rsc.parserhandler.resetParserData(name)){
                r("successfully reloaded parser '"+name+"'");
            }else{
                r("could not find parser '"+name+"'")
            }
            break;
        }
    }, [new Arg("cmdparser", ["parser"])])
]

module.exports = commands;