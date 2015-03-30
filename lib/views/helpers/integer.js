"use strict";
var Numeral = require("numeral");

module.exports = function (context) {
	return new Numeral(context).format("0,0");
};
