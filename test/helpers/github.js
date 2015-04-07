"use strict";
var Nock = require("nock");
var Util = require("util");

var GitHub = module.exports;

var api = "https://api.github.com";

function createNock (path) {
	return new Nock(api)
	.matchHeader("user-agent", "request")
	.get(path);
}

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

GitHub.CommitHistory = function (project, history, paginate) {
	var nocks = [];

	var path  = [
		"", "repos", project.payload.owner.login, project.payload.name, "commits"
	].join("/");

	function createLinks (index, length) {
		var headers = {};

		if (index < length -1) {
			headers.link = Util.format("<%s%s?page=%d>; rel=\"next\"", api, path, index + 2);
		}
		return headers;
	}

	history = history || [];

	this.payload = history;

	this.done = function () {
		nocks.forEach(function (nock) {
			nock.done();
		});
		return this;
	};

	this.fail = function (code) {
		if (paginate) {
			nocks.push(createNock(path).reply(200, this.payload.slice(0, -1), createLinks(0, 2)));
		}

		nocks.push(createNock(path + (paginate ? "?page=2" : "")).reply(code || 404));
		return this;
	};

	this.succeed = function () {
		if (paginate) {
			nocks = nocks.concat(this.payload.map(function (commit, index, list) {
				var url = path + (index ? "?page=" + (index + 1) : "");

				return createNock(url).reply(200, [ commit ], createLinks(index, list.length));
			}));
		}
		else {
			nocks.push(createNock(path).reply(200, this.payload));
		}

		history.forEach(function (commit) {
			if (commit.author && commit.author.login !== project.payload.owner.login) {
				var path = [
					"", "orgs", project.payload.owner.login, "members", commit.author.login
				].join("/");

				nocks.push(createNock(path).reply(commit.internal ? 204 : 404));
			}
		});

		return this;
	};
};

GitHub.ContributorList = function (project, contributors, paginate) {
	var path = [
		"", "repos", project.payload.owner.login, project.payload.name, "contributors"
	].join("/");

	contributors = contributors || [];

	var page = contributors.slice(0, -1);
	var end  = contributors.slice(-1);

	var pageHeaders = {
		link : Util.format("<%s%s?page=2>; rel=\"last\"", api, path)
	};

	var nocks = [];

	this.payload = contributors;

	this.done = function () {
		nocks.forEach(function (nock) {
			nock.done();
		});
		return this;
	};

	this.fail = function (code) {
		if (paginate) {
			nocks.push(
				createNock(path).reply(200, page, pageHeaders)
			);
		}

		nocks.push(
			createNock(path + (paginate ? "?page=2" : "")).reply(code || 404)
		);
		return this;
	};

	this.succeed = function () {
		if (paginate) {
			nocks.push(
				createNock(path).reply(200, page, pageHeaders),
				createNock(path + "?page=2").reply(200, end)
			);
		}
		else {
			nocks.push(
				createNock(path).reply(200, contributors)
			);
		}

		return this;
	};
};

GitHub.Project = function (token) {
	var payload = generateProjectPayload();

	var nock = createNock([ "", "repos", payload.owner.login, payload.name ].join("/"));

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

	var nock = createNock("/search/repositories?q=" + encodeURIComponent(query));

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
