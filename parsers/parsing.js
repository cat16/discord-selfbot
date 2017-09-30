const Message = require("discord.js").Message;
const ParserState = require("../parser-handler.js").ParserState;

/**
 * @property {string} msg - the text you want to replace the old text with
 * @property {object} options - the embed you want to add/replace the old one with
 */
let MsgEdit = class MsgEdit {
    /**
     * @param {string} [msg]
     * @param {object} [options]
     */
    constructor(msg, options){
        this.msg = msg;
        this.options = options;
    }
}

/**
 * an object holding what is necessary to make a parser for the bot
 * @property {string} name - the name of the parser to be displayed
 * @property {string} description - the description of the parser to be displayed
 * @property {function(Message) : Promise<Message>} parse - the function that parses messages and returns the final (eg. edited) message
 * @property {function() : object} save - a function that returns objects that need to be saved
 * @property {function(object)} load - a function that is called when the bot is loading that contains the data you saved
 * @property {ParserState} state - the state of the parser
 */
let Parser = class Parser{

    /**
     * @param {string} name 
     * @param {string} [description]
     * @param {function(Message) : Promise<Message>} parseFunc
     * @param {function()} saveFunc
     * @param {function(object)} loadFunc
     */
    constructor(name, description, parseFunc, saveFunc, loadFunc){
        this.name = name;
        this.description = description;
        this.parse = parseFunc;
        this.save = saveFunc;
        this.load = loadFunc;
        /**@type {ParserState} */
        this.state = undefined;
    }

}

module.exports.MsgEdit = MsgEdit;
module.exports.Parser = Parser;