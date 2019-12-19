/**
 * creates required folders to save results.
 */
const mkdirp = require("mkdirp");

module.exports = function(digits){
	mkdirp.sync(`results-${digits}dig`);
}