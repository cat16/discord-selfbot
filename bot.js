//make rejections actually give information so you can fix them

process.on('unhandledRejection', (reason, p) => {
    console.error('Unhandled Rejection at: Promise', p, 'reason:', reason);
});

console.log("loading...");

//create the selfbot

const Selfbot = require('./selfbot.js');
let bot = new Selfbot();

//add event for when the main process tells this process to stop

process.on('message', m => {
    if (m === "EXIT") {
        bot.save();
        process.exit(0);
    }
});

//start the bot

bot.load();