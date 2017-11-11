const { Message } = require('discord.js');
const { save, load, getDirectories, getFiles } = require("./tools.js");
const { Parser, MsgEdit } = require("./parsers/parsing.js");



/**
 * @property {boolean} enabled - whether the parser should parse or not
 */
class ParserState {
    constructor() {
        this.enabled = true;
    }
}

class ParserHandlerState {
    constructor() {
        this.data = {};
        this.states = {};
    }
}

/**
 * @property {Parser[]} parsers - an array of full parsers
 */
class ParserHandler {

    constructor() {
        /**
         * @type {Parser[]}
         */
        this.parsers = [];
        /**
         * @type {String}
         */
        this.directory = null;

        /**@type {ParserHandlerState} */
        this.state = new ParserHandlerState();
    }

    /**
     * @param {Message} msg 
     */
    parse(msg) {
        return new Promise(
            /**
             * @param {function(Message)} fulfill
             */
            (fulfill, reject) => {

                let i = 0;
                /**
                 * @param {Message} newMsg
                 */
                let edit = newMsg => {
                    if (i < this.parsers.length) {
                        let edited = null;
                        try {
                            edited = this.parsers[i].parse(newMsg, (msg) => { console.log("[parser:" + this.parsers[i].name + "] " + msg) });
                        } catch (ex) {
                            console.error("Error occured while using parser '" + this.parsers[i].name + "':");
                            console.error(ex.stack);
                        }
                        if (edited == null) {
                            i++;
                            edit(newMsg);
                        } else {
                            edited.then(msg => {
                                i++;
                                edit(msg);
                            });
                        }
                    } else {
                        fulfill(newMsg);
                    }
                }
                edit(msg);

            });
    }

    /**
     * loads all parsers in the directory specified
     * @argument {String} directory - the directory to look for parsers in
     */
    loadParsers(directory) {

        this.directory = directory;
        let state = load("parsing");
        if(state == null) state = {};
        this.state = Object.assign(new ParserHandlerState, load("parsing"));

        for (let file of getFiles(directory)) {
            if(file.endsWith('.js')) this.loadParser(file.slice(0, -3));
        }

        console.log("found and loaded " + this.parsers.length + " parsers.");
    }

    /**
     * Loads a parser from a file name (without the suffix).
     * @param {String} name 
     */
    loadParser(name) {
        /**@type {Parser} */
        let parser;
        try {
            parser = require(`${this.directory}/${name}.js`);
            if (parser instanceof Parser) {
                this.parsers.push(parser);
            }else{
                return;
            }
        } catch (ex) {
            console.error(
                `Could not load parser from file '${name}.js'!` +
                `\n - ${ex.stack}`
            );
            return;
        }
        if(this.state.states[parser.name] == null) this.state.states[parser.name] = new ParserState();
        parser.state = this.state.states[parser.name];
        try {
            if(this.state.data[parser.name]) this.state.data[parser.name] = {};
            parser.load(this.state.data[parser.name]);
        }catch(ex){
            parser.state.enabled = false;
            console.error(
                `Could not load data for parser '${name}'!` +
                '\n - Disabled the parser for safety' +
                `\n - ${ex.stack}`
            );
            return;
        }

    }

    /**
     * removes a parser
     * @param {string} name 
     * @return {boolean}
     */
    unloadParser(name) {
        for(let i = 0; i < this.parsers.length; i++){
            let parser = this.parsers[i];
            if(parser.name === name){
                this.parsers.splice(i, 1);
                return true;
            }
        }
        return false;
    }

    /**
     * Saves the parsers to the handler's state
     */
    saveParsers() {
        for (let parser of this.parsers) {
            this.state.states[parser.name] = parser.state;
            try {
                this.state.data[parser.name] = parser.save();
            } catch (ex) {
                console.error(
                    `Could not save data for parser '${parser.name}'!` +
                    `\n - ${ex.stack}`
                );
            }
        }
    }

    /**
     * saveParsers() but also saves to the bot's state file
     */
    save() {
        this.saveParsers();
        save('parsing', this.state);
    }

    /**
     * resets the data for a parser based on it's name
     * @param {string} name 
     */
    resetParserData(name) {
        let parser = this.getParser(name);
        if(parser==null) return false;
        parser.load({});
        this.save();
        this.unloadParser(name);
        this.loadParser(name);
        return true;
    }

    /**
     * gets a parser based on name
     * @param {string} name 
     * @return {Parser}
     */
    getParser(name){
        for (let parser of this.parsers) {
            if (parser.name === name) {
                return parser;
            }
        }
    }
}

module.exports.ParserState = ParserState;
module.exports.ParserHandler = ParserHandler;