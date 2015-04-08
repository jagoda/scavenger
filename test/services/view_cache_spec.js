"use strict";
var Bluebird      = require("bluebird");
var Catbox        = require("catbox");
var Configuration = require("../../lib/services/configuration");
var Environment   = require("apparition").Environment;
var MongoDB       = require("mongodb");
var Sinon         = require("sinon");
var ViewCache     = require("../../lib/services/view_cache");

var expect = require("chai").expect;

Bluebird.promisifyAll(MongoDB);

describe("The view cache service", function () {
	var configuration = new Configuration();

	function dropDatabase () {
		MongoDB.connectAsync(configuration.cache.database())
		.then(function (db) {
			return db.dropDatabaseAsync().return(db);
		})
		.then(function (db) {
			return db.closeAsync();
		});
	}

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

	describe("using authentication", function () {
		var cache       = new ViewCache();
		var environment = new Environment();

		before(function () {
			Sinon.spy(Catbox, "Client");
			environment.set("cache_database", "mongodb://foo:bar@localhost/test");

			return cache.start()
			.catch(function () {});
		});

		after(function () {
			cache.stop();
			Catbox.Client.restore();
			environment.restore();
		});

		it("authenticates with the backend database", function () {
			var options = Sinon.match({
				username : "foo",
				password : "bar"
			});

			expect(Catbox.Client.calledWith(Sinon.match.any, options)).to.be.true;
		});
	});
});
