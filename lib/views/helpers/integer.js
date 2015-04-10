"use strict";
var Numeral = require("numeral");

module.exports = function (context) {
	if ("number" === typeof context) {
		return new Numeral(context).format("0,0");
	}

	return "Unknown";
};
