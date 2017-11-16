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
    if(source.startsWith('.')) source = source.substring(1);
    let dirs = readdirSync(__dirname + source).map(name => join(__dirname + source, name)).filter(isDirectory);
    for (let dir in dirs) {
        dirs[dir] = dirs[dir].slice(__dirname.length + source.length + 1);
    }
    return dirs;
}
/**
 * gets all files in a directory
 * @param {string} source 
 * @return {string[]}
 */
let getFiles = source => {
    if(source.startsWith('.')) source = source.substring(1);
    let files = readdirSync(__dirname + source).map(name => join(__dirname + source, name)).filter(isFile);
    for (let file in files) {
        files[file] = files[file].slice(__dirname.length + source.length + 1);
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
    } catch (ex) { console.error("tools.js#load() > " + ex.stack) }
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
        .replace(new RegExp(config.email, 'g'), '[EMAIL]')
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
let embedList = (title, list, infoFunc) => {
    let listText = "";
    for (let item of list) {
        let itemText = "\n:small_blue_diamond: " + infoFunc(item);
        listText += itemText;
    }
    return new RichEmbed()
        .setTitle(`:large_orange_diamond: - ${title} :`)
        .setDescription(listText);
}

let hastebin = async (text, language = '') => {
    const snek = require('snekfetch');
    let haste = await snek.post('https://hastebin.com/documents')
        .send(text)
        .catch(err => {
            console.error('An error occured while trying to post to hastebin: ' + err.stack)
        })
    let url = "The input was too long for haste or something... idk";
    if(haste!=null) url = `​https://hastebin.com/${haste.body.key}`;
    return url
}

/**
 * checks if a derived class extends another one
 * @param {object} derived - the object you want to check (doesn't actually have to be a class)
 * @param {function} className - the class you want to compare with
 * @return {boolean} whether or not the object extends the specified class
 */
let classExtends = (derived, base) => {
    return typeof derived === 'function' && new RegExp(`^class .+ extends ${base.name} .+`).test(derived.toString());
}

module.exports = {
    getDirectories,
    getFiles,
    stringifyFull,
    objectifyFull,
    save,
    load,
    hold,
    release,
    promiseChain,
    hastebin,
    classExtends,
    //discord specific
    prepCode,
    unPrepCode,
    embedList
}