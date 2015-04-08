"use strict";
var Bluebird    = require("bluebird");
var Environment = require("apparition").Environment;
var MongoDB     = require("mongodb");
var ViewCache   = require("../../lib/services/view_cache");

var expect = require("chai").expect;

Bluebird.promisifyAll(MongoDB);

describe("The view cache service", function () {
	var environment = new Environment();

	function dropDatabase () {
		MongoDB.connectAsync("mongodb://localhost/test")
		.then(function (db) {
			return db.dropDatabaseAsync().return(db);
		})
		.then(function (db) {
			return db.closeAsync();
		});
	}

	before(function () {
		environment.set("cache_database", "test");
	});

	after(function () {
		environment.restore();
	});

	describe("when not started", function () {
		var cache = new ViewCache();
		var result;

		before(function () {
			return cache.get("/foo/bar")
			.catch(function (error) {
				result = error;
			});
		});

		it("fails", function () {
			expect(result).to.be.an.instanceOf(Error);
		});
	});

	describe("when stopped", function () {
		var cache = new ViewCache();
		var result;

		before(function () {
			return cache.start()
			.then(function () {
				return cache.stop();
			})
			.then(function () {
				return cache.get("/foo/bar");
			})
			.catch(function (error) {
				result = error;
			});
		});

		it("fails", function () {
			expect(result).to.be.an.instanceOf(Error);
		});
	});

	describe("fetching an item that is not cached", function () {
		var cache = new ViewCache();
		var result;

		before(function () {
			return cache.start()
			.then(function () {
				return cache.get("/foo/bar");
			})
			.then(function (data) {
				result = data;
			});
		});

		after(function () {
			cache.stop();
			return dropDatabase();
		});

		it("returns 'null'", function () {
			expect(result).to.be.null;
		});
	});

	describe("fetching an item that is cached", function () {
		var cache = new ViewCache();
		var key   = "/foo/bar";
		var value = 42;
		var result;

		before(function () {
			return cache.start()
			.then(function () {
				return cache.set(key, value);
			})
			.then(function () {
				return cache.get(key);
			})
			.then(function (data) {
				result = data;
			});
		});

		after(function () {
			cache.stop();
			return dropDatabase();
		});

		it("returns the cached item", function () {
			expect(result).to.equal(value);
		});
	});
});
