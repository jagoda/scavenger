"use strict";
var Configuration = require("../../lib/services/configuration");
var Environment   = require("apparition").Environment;

var expect = require("chai").expect;

describe("The configuration service", function () {
	var configuration = new Configuration();
	var environment   = new Environment();

	describe("without the CACHE_DATABASE environment variable", function () {
		before(function () {
			environment.delete("cache_database");
		});

		after(function () {
			environment.restore();
		});

		it("uses a local database by default", function () {
			expect(configuration.cache.database()).to.equal("mongodb://localhost:27017/scavenger");
		});
	});

	describe("with the CACHE_DATABASE environment variable", function () {
		var database = "mongodb://foo:bar@example.com/stuff";

		before(function () {
			environment.set("cache_database", database);
		});

		after(function () {
			environment.restore();
		});

		it("uses the specified database", function () {
			expect(configuration.cache.database()).to.equal(database);
		});
	});

	describe("without the DISABLE_CACHE environment variable", function () {
		before(function () {
			environment.delete("disable_cache");
		});

		after(function () {
			environment.restore();
		});

		it("enables the cache by default", function () {
			expect(configuration.cache.enabled()).to.be.true;
		});
	});

	describe("with the DISABLE_CACHE environment variable", function () {
		before(function () {
			environment.set("disable_cache", true);
		});

		after(function () {
			environment.restore();
		});

		it("disables the cache", function () {
			expect(configuration.cache.enabled()).to.be.false;
		});
	});
});
