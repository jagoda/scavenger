"use strict";

function Cache () {
	this.database = function () {
		return process.env.CACHE_DATABASE || "mongodb://localhost:27017/scavenger";
	};

	this.enabled = function () {
		return !process.env.DISABLE_CACHE;
	};
}

function Configuration () {
	this.cache = new Cache();
}

module.exports = Configuration;
