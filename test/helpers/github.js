"use strict";
var Nock = require("nock");
var Util = require("util");

var GitHub = module.exports;

var api = "https://api.github.com";

function generateInteger () {
	return Math.round(Math.random() * 10000) + 1000;
}

function generateString () {
	var length = 15;
	var buffer = new Buffer(length);
	var max    = 122;    // End of ASCII alphabet.
	var min    = 97;     // Beginning of ASCII alphabet.

	for (var offset = 0; offset < length; offset += 1) {
		var character = Math.round(Math.random() * (max - min) + min);
		buffer.writeInt8(character, offset);
	}

	return buffer.toString();
}

function generateProjectPayload () {
	return {
		owner : {
			login : generateString()
		},

		description       : generateString(),
		forks_count       : generateInteger(),
		language          : generateString(),
		name              : generateString(),
		private           : false,
		stargazers_count  : generateInteger(),
		subscribers_count : generateInteger()
	};
}

GitHub.Project = function (token) {
	var payload = generateProjectPayload();

	var nock = new Nock(api)
	.matchHeader("user-agent", "request")
	.get([ "", "repos", payload.owner.login, payload.name ].join("/"));

	if (token) {
		nock.matchHeader("authorization", "Basic " +
			new Buffer(token + ":x-oauth-basic").toString("base64"));
	}

	this.payload = payload;

	this.done = function () {
		nock.done();
		return this;
	};

	this.fail = function (code) {
		nock = nock.reply(code || 404);
		return this;
	};

	this.githubUrl = function () {
		return Util.format("https://github.com/%s/%s", payload.owner.login, payload.name);
	};

	this.succeed = function () {
		nock = nock.reply(200, payload);
		return this;
	};

	this.url = function () {
		return Util.format("/%s/%s", payload.owner.login, payload.name);
	};
};

GitHub.Search = function (projects, query) {
	var payload = {
		items : projects.map(function (project) {
			return project.payload;
		})
	};

	var nock = new Nock(api)
	.matchHeader("user-agent", "request")
	.get("/search/repositories?q=" + encodeURIComponent(query));

	this.payload = payload;

	this.done = function () {
		nock.done();
		return this;
	};

	this.fail = function (code) {
		nock = nock.reply(code || 404);
		return this;
	};

	this.succeed = function () {
		nock = nock.reply(200, payload);
		return this;
	};
};
