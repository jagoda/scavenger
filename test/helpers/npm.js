"use strict";
var GitHub = require("./github");
var Nock   = require("nock");
var Npm    = module.exports;
var Util   = require("util");

var npmApi = "https://api.npmjs.org";

Npm.Downloads = function (project, files, options) {
	var nocks = [];

	options = options || {};

	files = files ||
		[
			{
				path         : "package.json",
				download_url : Util.format(
					"https://raw.githubusercontent.com/%s/%s/master/package.json",
					project.payload.owner.login,
					project.payload.name
				)
			}
		];

	nocks.push(new GitHub.Files(project, files).succeed());
	if (!options.noMatch) {
		nocks.push(new GitHub.Files(project, files).succeed());
	}

	var manifest;
	if (options.invalid) {
		manifest = "";
	}
	else {
		manifest = { name : project.payload.name };
	}

	nocks.push(
		new Nock("https://raw.githubusercontent.com")
		.get(
			Util.format(
				"/%s/%s/master/package.json",
				project.payload.owner.login,
				project.payload.name
			)
		)
		.reply(200, manifest)
	);

	var path = Util.format("/downloads/point/last-month/%s", project.payload.name);

	this.payload = {
		downloads : 42000,
		"start"   : "2015-03-11",
		"end"     : "2015-04-09",
		"package" : project.payload.name
	};

	this.done = function () {
		nocks.forEach(function (nock) {
			nock.done();
		});
		return this;
	};

	this.fail = function (code) {
		nocks.push(
			new Nock(npmApi)
			.get(path)
			.reply(code || 404)
		);
		return this;
	};

	this.succeed = function () {
		if (!options.invalid) {
			nocks.push(
				new Nock(npmApi)
				.get(path)
				.reply(200, this.payload)
			);
		}
		return this;
	};
};
