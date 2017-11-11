const { Command, UserArg } = require('../commands.js');

module.exports = class GetProfilePicCommand extends Command {
    constructor(bot) {
        super(bot, {
            name: "getProfilePic",
            description: "gets the link to someone's profile picture",
            aliases: ["getPic"],
            args: [
                new UserArg("user")
            ]
        })
    }

    run(msg, args) {
        /**@type {User} */
        let user = args.user;
        msg.channel.send(user.username + "'s profile picture link: " + user.displayAvatarURL);
    }
}