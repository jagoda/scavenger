"use strict";
var Bluebird    = require("bluebird");
var Environment = require("apparition").Environment;
var Hapi        = require("hapi");
var Sinon       = require("sinon");
var Web         = require("../../lib/plugins/web");

var expect = require("chai").expect;

Bluebird.promisifyAll(Hapi);

describe("The web plugin", function () {
	function matchTags (event) {
		return event && event.tags && Array.isArray(event.tags) &&
			0 <= event.tags.indexOf("warn") &&
			0 <= event.tags.indexOf("github");
	}

	function matchMessage (event) {
		return event && event.data && /github_token is not defined/i.test(event.data);
	}

	it("is a Hapi plugin", function () {
		expect(Web)
		.to.have.property("register").that.is.a("function")
		.that.has.property("attributes")
		.that.has.property("name", "web");
	});

	describe("when the GitHub service is configured with an API token", function () {
		var environment = new Environment();
		var log         = Sinon.stub();
		var server      = new Hapi.Server();

		before(function () {
			environment.set("github_token", "anapitoken");
			server.connection();
			server.on("log", log);
			return server.registerAsync(Web);
		});

		after(function () {
			environment.restore();
		});

		it("does not log a warning message", function () {
			var event = Sinon.match(function (value) {
				return matchTags(value) && matchMessage(value);
			});

			expect(log.calledWith(event), "log message").to.be.false;
		});
	});

	describe("when the GitHub service is not configured with an API token", function () {
		var environment = new Environment();
		var log         = Sinon.stub();
		var server      = new Hapi.Server();

		before(function () {
			environment.delete("github_token");
			server.connection();
			server.on("log", log);
			return server.registerAsync(Web);
		});

		after(function () {
			environment.restore();
		});

		it("logs a warning message", function () {
			var event = Sinon.match(function (value) {
				return matchTags(value) && matchMessage(value);
			});

			expect(log.calledWith(event), "log message").to.be.true;
		});
	});
});
