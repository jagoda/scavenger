"use strict";
var Bluebird    = require("bluebird");
var Browser     = require("zombie");
var Environment = require("apparition").Environment;
var MongoHelper = require("./mongo");
var Nock        = require("nock");

var environment = new Environment();

environment
.set("cache_database", "mongodb://localhost/test")
.set("disable_cache", true)
.delete("github_token");

// Need to configure the server before loading the module. This assumes
// that this file is the first test file that is loaded...
var Scavenger = require("../../lib/server");

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

	// Disable log output during tests.
	Scavenger.plugins.good.monitor.stop();
	return started.then(function () {
		Browser.site = Scavenger.info.uri;
		Nock.enableNetConnect(Scavenger.info.host);
	});
});

after(function () {
	// Server is started automatically. Need to stop it afterwards to allow the
	// tests to exit.
	return Scavenger.stopAsync()
	.then(function () {
		// Clean-up view cache.
		return MongoHelper.dropDatabase();
	})
	.then(function () {
		environment.restore();
	});
});
