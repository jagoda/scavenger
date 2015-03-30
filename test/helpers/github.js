"use strict";
var Nock = require("nock");

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

GitHub.project = {
	generate : function () {
		return {
			owner : {
				login : generateString()
			},

			description      : generateString(),
			forks_count      : generateInteger(),
			language         : generateString(),
			name             : generateString(),
			private          : false,
			stargazers_count : generateInteger(),
			watchers_count   : generateInteger()
		};
	},

	nock : function (project) {
		return new Nock(api)
		.matchHeader("user-agent", "request")
		.get([ "", "repos", project.owner.login, project.name ].join("/"));
	}
};

GitHub.search = {
	generate : function (count) {
		var payload = {
			items : []
		};

		for (var i = 0; i < count; i += 1) {
			payload.items.push(GitHub.project.generate());
		}

		return payload;
	},

	nock : function (query) {
		return new Nock(api)
		.matchHeader("user-agent", "request")
		.get("/search/repositories?q=" + encodeURIComponent(query));
	}
};
