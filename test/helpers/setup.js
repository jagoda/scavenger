"use strict";
var Bluebird    = require("bluebird");
var Browser     = require("zombie");
var Environment = require("apparition").Environment;
var Nock        = require("nock");
var Scavenger   = require("../../lib/server");

var environment = new Environment();

before(function () {
	var started;

	if (Scavenger.info.started) {
		started = Bluebird.resolve();
	}
	else {
		started = new Bluebird(function (resolve) {
			Scavenger.on("start", resolve);
		});
	}

	environment
	.set("disable_cache", true)
	.delete("github_token");

	// Disable log output during tests.
	Scavenger.plugins.good.monitor.stop();
	return started.then(function () {
		Browser.site = Scavenger.info.uri;
		Nock.enableNetConnect(Scavenger.info.host);
	});
});

after(function () {
	environment.restore();
	// Server is started automatically. Need to stop it afterwards to allow the
	// tests to exit.
	return Scavenger.stopAsync();
});
