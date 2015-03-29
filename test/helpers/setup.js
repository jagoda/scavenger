"use strict";
var Browser   = require("zombie");
var Nock      = require("nock");
var Scavenger = require("../../lib/server");

var expect = require("chai").expect;

before(function () {
	expect(Scavenger.info.started, "server started").to.be.greaterThan(0);
	Browser.site = Scavenger.info.uri;
	Nock.enableNetConnect(Scavenger.info.host);
	// Disable log output during tests.
	Scavenger.plugins.good.monitor.stop();
});

after(function () {
	// Server is started automatically. Need to stop it afterwards to allow the
	// tests to exit.
	return Scavenger.stopAsync();
});
