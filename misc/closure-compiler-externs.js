// environment

/**
 * @param name
 * @return {*}
 */
var require = function(name) {}

/**
 * @type {Object}
 */
var module = {};

/**
 * @type {*}
 */
var exports;

/**
 * @type {Object.<string,*>}
 */
module.exports;

/**
 * @type {function(string)}
 */
module.require;

/**
 * @type {string}
 */
module.filename;

/**
 * @type {boolean}
 */
module.loaded;

/**
 * @type {*}
 */
module.parent;

/**
 * @type {Array}
 */
module.children;

/**
 * @type {Object.<string,*>}
 */
var global = {};


/**
 * @type {string}
 */
var __filename;

/**
 * @type {string}
 */
var __dirname;

/**
 * @param {...*} var_args
 * @constructor
 * @nosideeffects
 */
function Buffer(var_args) {};

/**
 * @param {*} obj
 * @param {*} obj
 * @return {Buffer}
 * @nosideeffects
 */
Buffer.from = function(obj,opts) {};

/**
 * @constructor
 */
var process = function() {};

/**
 * @param {number=} code
 */
process.exit = function(code) {};

/**
 * @param {function(...[*])} callback
 * @param {number} delay
 * @param {...*} var_args
 * @return {*}
 */
function setTimeout(callback, delay, var_args) {};

/**
 * @param {*} timeoutId
 */
function clearTimeout(timeoutId) {};

/**
 * @param {function(...[*])} callback
 * @param {number} delay
 * @param {...*} var_args
 * @return {*}
 */
function setInterval(callback, delay, var_args) {};

/**
 * @param {*} intervalId
 */
function clearInterval(intervalId) {};

/**
 * @type {Object.<string,function(*, ...[*])>}
 */
var console = {};

/**
 * @param {*} data
 * @param {...*} var_args
 */
console.log = function(data, var_args) {};

/**
 * @param {*} data
 * @param {...*} var_args
 */
console.error = function(data, var_args) {};
