"use strict";
var NativeURL = require("url");
var Path      = require("path");

var URL = module.exports;

URL.file = function (path) {
	path = path.replace(/\\/g, "/");

	if (path[0] !== "/") {
		path = "/" + path;
	}

	return NativeURL.format("file://" + path);
};

URL.fixture = function (name) {
	return this.file(Path.join(__dirname, "fixtures", name));
};

URL.project = function (owner, name) {
	return [ "", owner, name ].join("/");
};
