const { lstatSync, readdirSync } = require('fs');
const { join } = require('path');
const cycle = require('cycle');
const config = require("./config.json");

const { RichEmbed } = require('discord.js');

/**
 * @param {string} source 
 * @return {boolean}
 */
const isDirectory = source => lstatSync(source).isDirectory();
/**
 * @param {string} source 
 * @return {boolean}
 */
const isFile = source => lstatSync(source).isFile();

/**
 * gets all folders in a directory
 * @param {string} source 
 * @return {string[]}
 */
let getDirectories = source => {
    let dirs = readdirSync(__dirname + source).map(name => join(__dirname + source, name)).filter(isDirectory);
    for (let dir in dirs) {
        dirs[dir] = dirs[dir].slice(__dirname.length);
    }
    return dirs;
}
/**
 * gets all files in a directory
 * @param {string} source 
 * @return {string[]}
 */
let getFiles = source => {
    let files = readdirSync(__dirname + source).map(name => join(__dirname + source, name)).filter(isFile);
    for (let file in files) {
        files[file] = files[file].slice(__dirname.length);
    }
    return files;
}

/**
 * Turns all functions in an object to a string
 * @param {object} obj 
 * @return {object}
 */
let stringifyFunctions = (obj) => {
    for (let key in obj) {
        if (obj[key] instanceof Function) {
            obj[key] = obj[key].toString();
        } else if (obj[key] instanceof Object) {
            obj[key] = stringifyFunctions(obj[key]);
        }
    }
    return obj;
}

/**
 * Returns the full object, functions and cycles saved for objectifyFull, as a string
 * @param {object} obj
 * @return {string}
 */
let stringifyFull = (obj) => {
    return JSON.stringify(stringifyFunctions(cycle.decycle(obj)), null, '\t');
    //JSON.stringify(<object>, null, '\t') for formatting, but we want compression
}

/**
 * @param {string} category - the category you want to save data for
 * @param {object} data - the data you want to save
 */
let save = (category, data) => {
    let write = { [category]: data }
    try {
        let state = require("./state.json");
        state[category] = data;
        write = state;
    } catch (ex) { }
    const fs = require('fs');
    fs.writeFileSync(__dirname + "/state.json", stringifyFull(write));
}

/**
 * Turns all strings in an object that can be turned into functions into functions
 * @param {object} obj 
 * @return {object}
 */
let objectifyFunctions = (obj) => {
    for (let key in obj) {
        if (typeof (obj[key]) === "string") {
            try {
                eval("var func = " + obj[key]);
                if (func instanceof Function) {
                    obj[key] = func;
                }
            } catch (ex) { }
        } else if (obj[key] instanceof Object) {
            obj[key] = objectifyFunctions(obj[key]);
        }
    }
    return obj;
}

/**
 * Turns an object from require() back into it's original object after stringifyFull was used to put it there
 * @param {string} obj
 */
let objectifyFull = (obj) => {
    return cycle.retrocycle(objectifyFunctions(obj));
}

/**
 * @param {string} category - the category you want to load
 */
let load = (category) => {
    let data = {};
    try {
        let state = require("./state.json");
        if (state[category] != null) {
            data = objectifyFull(state[category]);
        }
    } catch (ex) { console.error("tools.js#load() > "+ex.stack) }
    return data;
}

/**
 * stores data in the main process for restarting
 * @param {string} name 
 * @param {object} data 
 */
let hold = (name, data) => {
    process.send("HOLD:" + name.length + ":" + name + stringifyFull(data));
}

/**
 * releases and returns data stored in the main process (from 'hold')
 * @param {string} name 
 */
let release = (name) => {
    process.send("RELEASE:" + name);
    return new Promise(function (resolve, reject) {
        process.once('message', resolve);
    });
}

/**
 * Chains promises, inserting the data from the previous into the next
 * @param {(function(object):Promise|void)[]} funcs
 * @param {Promise} promise
 */
let promiseChain = (promise, funcs) => {
    if (funcs.length > 0) {
        promise.then(data => {
            let func = funcs.shift();
            promiseChain(func(data), funcs);
        });
    }
}

/**
 * Prepares code to be sent in a discord code block
 * @param {string} code 
 */
let prepCode = (code) => {
    return code
        .replace(new RegExp("```", 'g'), "[CODEBLOCK]")
        .replace(new RegExp(config.token, 'g'), "[TOKEN]")
}

/**
 * Reverts prepCode
 * @param {string} code 
 */
let unPrepCode = (code) => {
    return code
        .replace(new RegExp("[CODEBLOCK]", 'g'), "```")
        .replace(new RegExp("[TOKEN]", 'g'), config.token)
}

/**
 * 
 * @param {string} title - the title of the list
 * @param {T[]} list - the list of objects you want to list
 * @param {function(T):string} infoFunc - a function that returns the information you want to list for each object
 * @param {number} [barFix] - the number of 
 * @template T - an object
 */
let embedList = (title, list, infoFunc, barFix) => {
    if (barFix == null) barFix = 0;
    let listText = "";
    let maxLength = 0;
    for (let item of list) {
        let itemText = "\n:small_blue_diamond: " + infoFunc(item);
        if (itemText.length > maxLength) {
            maxLength = itemText.length;
        }
        listText += itemText;
    }
    let bar = "";
    for (let i = 0; i < ((maxLength - 18 + barFix) / 2) - (title.length / 2); i++) bar += "-";
    return new RichEmbed()
        .setTitle(":large_orange_diamond:" + bar + title + bar)
        .setDescription(listText);
}

//data related
module.exports.getDirectories = getDirectories;
module.exports.getFiles = getFiles;
module.exports.stringifyFull = stringifyFull;
module.exports.objectifyFull = objectifyFull;
module.exports.save = save;
module.exports.load = load;
module.exports.hold = hold;
module.exports.release = release;
//idk
module.exports.promiseChain = promiseChain;
//discord specific
module.exports.prepCode = prepCode;
module.exports.unPrepCode = unPrepCode;
module.exports.embedList = embedList;