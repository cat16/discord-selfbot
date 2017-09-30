const { Message } = require('discord.js');
const { save, load, getDirectories, getFiles } = require("./tools.js");
const { Parser, MsgEdit } = require("./parsers/parsing.js");
const Resources = require("./resources.js");



/**
 * @property {boolean} enabled - whether the parser should parse or not
 */
class ParserState {
    /**
     * @param {boolean} enabled
     */
    constructor(enabled) {
        this.enabled = enabled;
    }
}

/**
 * @property {Parser[]} parsers - an array of full parsers
 * @property {Resources} resources - the resources the bot has
 */
class ParserHandler {

    constructor() {
        /**
         * @type {Parser[]}
         */
        this.parsers = [];
        /**
         * @type {Resources}
         */
        this.resources = null;
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
                        edited = this.parsers[i].parse(newMsg);
                    } catch (ex) {
                        console.error("Error occured while using parser '" + this.parsers[i].name + "':");
                        console.errer(ex.stack);
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

        for (let file of getFiles(directory)) {

            try {

                let obj = require("./" + file);
                if (obj instanceof Parser) {
                    this.parsers.push(obj);
                }

            } catch (ex) {
                console.error(
                    "Could not load parser from file '" + file.split("\\parsers\\")[1] + "'!" +
                    "\n - " + ex.stack
                );

            }
        }

        let loadData = load("parsing");

        for (let i = 0; i < this.parsers.length; i++) {

            let parser = this.parsers[i];

            if (loadData.states == null) loadData.states = {};
            if (loadData.states[parser.name] == null) loadData.states[parser.name] = new ParserState(true);
            let data = loadData.states[parser.name];

            if (loadData.data == null) loadData.data = {};
            if (loadData.data[parser.name] == null) loadData.data[parser.name] = {};

            try {
                parser.load(loadData.data[parser.name]);

                if (loadData.data == null) loadData.state = {};
                if (data != null) parser.state = data;

            } catch (ex) {
                this.parsers.splice(i, 1);
                i--;

                console.error(
                    "Could not load data for parser '" + parser.name + "'!" +
                    "\n - " + ex.stack
                );

            }
        }

        console.log("found and loaded " + this.parsers.length + " parsers.");

    }

    save() {
        let saveData = {
            states: {},
            data: {}
        };
        for (let parser of this.parsers) {
            saveData.states[parser.name] = parser.state;
            try {
                saveData.data[parser.name] = parser.save();
            } catch (ex) {
                console.error(
                    "Could not save data for parser '" + parser.name + "'!" +
                    "\n - " + ex.stack
                );
            }
        }
        save("parsing", saveData);
    }
}

module.exports.ParserState = ParserState;
module.exports.ParserHandler = ParserHandler;