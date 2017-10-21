//output control

/**
 * @param {string} prefix 
 * @param {object} output 
 */
let indentOutput = (prefix, output) => {
    /**@type {string} */
    let outputStr = output.toString();
    let spaces = "   ";
    for (let i = 0; i < prefix.length; i++) {
        spaces += " ";
    }
    let lines = outputStr.split("\n");
    let text = prefix + " > " + lines.shift();
    for (let line of lines) {
        if (line.length > 0)
            text += "\n" + spaces + line;
    }
    return text;
}

let phase = name => {
    console.log("----------[" + name + "]----------");
}

let log = (msg, prefix) => {
    if (prefix == null)
        console.log(indentOutput("main", msg));
    else
        console.log(indentOutput(prefix, msg));
}

let err = (msg, prefix) => {
    if (prefix == null)
        console.error(indentOutput("main", msg));
    else
        console.error(indentOutput(prefix, msg));
}

//start of bot

phase("Bot Starting");
log("using node " + process.version);

let fork = require('child_process').fork;

let storage = {};

/**@type {function()} */
let exitChild;

let createBot = () => {

    let child = fork(__dirname + '/bot.js', [], {
        stdio: 'pipe',
        execArgv: ["--inspect=9999"] //required (and useful anyway) for Visual Studio Code to deploy the process
    });

    exitChild = () => {
        child.send("EXIT");
    }

    //bot output

    child.stdout.on('data', function (data) {
        log(data, "bot");
    });

    child.stderr.on('data', function (data) {
        err(data, "bot");
    });

    child.on('exit', code => {
        exitChild = null;
        switch (code) {
            case 0:
                process.exit(0);
                break;
            case 100:
                phase("Bot Restarting");
                createBot();
                break;
            case 1:
                err("The bot crashed!");
                process.exit(0);
                break;
            default:
                err("The bot exited unusually! (exit code " + code + ")");
                process.exit(0);
                break;
        }
    });

    child.on('error', err => {
        phase("Bot Crashed");
        err(err.stack);
    });

    child.on("message", m => {
        /**@type {string} */
        let msg = m;

        let protocol = msg.split(":", 2)[0];
        msg = msg.substring(msg.indexOf(":")+1);

        switch (protocol) {
            case "HOLD": {
                let data = msg.split(":", 2);

                let nameLength = parseInt(data[0]);
                let name = data[1].slice(0, nameLength);
                let save = data[1].slice(nameLength);

                storage[name] = save;

                log("recieved and stored '" + name + "' from bot");
                break;
            }
            case "RELEASE":{
                let name = msg;

                let data = storage[name];
                if(data == null){
                    data = "NO_DATA";
                }
                child.send(data);

                delete storage[name];

                if(data !== "NO_DATA") log("released '"+name+"' to bot");
                break;
            }
            case "READY": {
                phase("Bot Ready");
                break;
            }
        }


    });

}

const Signal = {
    EXIT: 0,
    CRASH: 1
}

let exitHandler = function (signal) {
    switch (signal) {
        case Signal.CRASH:
            err("program crashed!");
        case Signal.EXIT:
            if(exitChild != null)
                exitChild();
            phase("Bot Stopped");
            break;
    }
}

process.on('exit', exitHandler.bind(Signal.EXIT));

process.on('uncaughtException', exitHandler.bind(Signal.CRASH));

//catch when the terminal is closed
process.on('SIGHUP', exitHandler.bind(Signal.EXIT));

//catch ctrl+c event
process.on('SIGINT', exitHandler.bind(Signal.EXIT));

log("deploying bot process...");

createBot();