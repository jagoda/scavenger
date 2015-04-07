"use strict";
var Browser     = require("zombie");
var Environment = require("apparition").Environment;
var Nock        = require("nock");
var Scavenger   = require("../../lib/server");

var expect = require("chai").expect;

var environment = new Environment();

before(function () {
	expect(Scavenger.info.started, "server started").to.be.greaterThan(0);
	Browser.site = Scavenger.info.uri;
	Nock.enableNetConnect(Scavenger.info.host);

	environment
	.set("disable_cache", true)
	.delete("github_token");

	// Disable log output during tests.
	Scavenger.plugins.good.monitor.stop();
});

after(function () {
	environment.restore();
	// Server is started automatically. Need to stop it afterwards to allow the
	// tests to exit.
	return Scavenger.stopAsync();
});
