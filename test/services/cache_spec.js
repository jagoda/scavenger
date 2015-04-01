"use strict";
var Cache       = require("../../lib/services/cache");
var Environment = require("apparition").Environment;
var Nock        = require("nock");

var expect = require("chai").expect;

describe("The cache service", function () {
	var host    = "http://example.com";
	var path    = "/some/path";
	var payload = { key : "value" };

	describe("when not started", function () {
		var cache = new Cache();
		var result;

		before(function () {
			return cache.get(host)
			.catch(function (error) {
				result = error;
			});
		});

		it("fails", function () {
			expect(result).to.be.an.instanceOf(Error);
		});
	});

	describe("when stopped", function () {
		var cache = new Cache();
		var result;

		before(function () {
			return cache.start()
			.then(function () {
				cache.stop();
				return cache.get(host);
			})
			.catch(function (error) {
				result = error;
			});
		});

		after(function () {
			cache.stop();
		});

		it("fails", function () {
			expect(result).to.be.an.instanceOf(Error);
		});
	});

	describe("when caching is enabled", function () {
		var environment = new Environment();

		before(function () {
			environment.delete("disable_cache");
		});

		after(function () {
			environment.restore();
		});

		describe("retrieving a value", function () {
			describe("with a successful response", function () {
				var cache = new Cache();
				var result;

				before(function () {
					var request = new Nock(host).get(path).reply(200, payload);

					return cache.start()
					.then(function () {
						return cache.get(host + path);
					})
					.then(function (response) {
						result = response;
					})
					.finally(function () {
						request.done();
					});
				});

				after(function () {
					cache.stop();
					Nock.cleanAll();
				});

				it("returns the request results", function () {
					expect(result).to.have.length(2);
					expect(result[0]).to.be.an("object").that.has.property("statusCode", 200);
					expect(result[1]).to.deep.equal(payload);
				});

				describe("again", function () {
					var result;

					before(function () {
						// Nock will block any network requests.
						return cache.get(host + path)
						.then(function (response) {
							result = response;
						});
					});

					it("returns the request results", function () {
						expect(result).to.have.length(2);
						expect(result[0]).to.be.an("object").that.has.property("statusCode", 200);
						expect(result[1]).to.deep.equal(payload);
					});
				});
			});

			describe("with an error response", function () {
				var cache = new Cache();
				var result;

				before(function () {
					var request = new Nock(host).get(path).reply(404, payload);

					return cache.start()
					.then(function () {
						return cache.get(host + path);
					})
					.then(function (response) {
						result = response;
					})
					.finally(function () {
						request.done();
					});
				});

				after(function () {
					cache.stop();
					Nock.cleanAll();
				});

				it("returns the request results", function () {
					expect(result).to.have.length(2);
					expect(result[0]).to.be.an("object").that.has.property("statusCode", 404);
					expect(result[1]).to.deep.equal(payload);
				});

				describe("again", function () {
					var result;

					before(function () {
						var request = new Nock(host).get(path).reply(404, payload);
						return cache.get(host + path)
						.then(function (response) {
							result = response;
						})
						.finally(function () {
							// Error responses should not be cached.
							request.done();
						});
					});

					it("returns the request results", function () {
						expect(result).to.have.length(2);
						expect(result[0]).to.be.an("object").that.has.property("statusCode", 404);
						expect(result[1]).to.deep.equal(payload);
					});
				});
			});
		});

		describe("specifying additional headers", function () {
			var cache = new Cache();

			before(function () {
				return cache.start();
			});

			after(function () {
				cache.stop();
			});

			it("sends the headers with the request", function () {
				var request = new Nock("http://example.com")
				.matchHeader("x-custom-header", "foo")
				.get("/")
				.reply(204);

				return cache.get("http://example.com/", { "x-custom-header" : "foo" })
				.finally(function () {
					request.done();
				});
			});
		});
	});

	describe("when caching is disabled", function () {
		var environment = new Environment();

		before(function () {
			environment.set("disable_cache", true);
		});

		after(function () {
			environment.restore();
		});

		describe("retrieving a value", function () {
			describe("with a successful response", function () {
				var cache = new Cache();
				var result;

				before(function () {
					var request = new Nock(host).get(path).reply(200, payload);

					return cache.start()
					.then(function () {
						return cache.get(host + path);
					})
					.then(function (response) {
						result = response;
					})
					.finally(function () {
						request.done();
					});
				});

				after(function () {
					cache.stop();
					Nock.cleanAll();
				});

				it("returns the request results", function () {
					expect(result).to.have.length(2);
					expect(result[0]).to.be.an("object").that.has.property("statusCode", 200);
					expect(result[1]).to.deep.equal(payload);
				});

				describe("again", function () {
					var result;

					before(function () {
						var request = new Nock(host).get(path).reply(200, payload);
						return cache.get(host + path)
						.then(function (response) {
							result = response;
						})
						.finally(function () {
							request.done();
						});
					});

					it("returns the request results", function () {
						expect(result).to.have.length(2);
						expect(result[0]).to.be.an("object").that.has.property("statusCode", 200);
						expect(result[1]).to.deep.equal(payload);
					});
				});
			});

			describe("with an error response", function () {
				var cache = new Cache();
				var result;

				before(function () {
					var request = new Nock(host).get(path).reply(404, payload);

					return cache.start()
					.then(function () {
						return cache.get(host + path);
					})
					.then(function (response) {
						result = response;
					})
					.finally(function () {
						request.done();
					});
				});

				after(function () {
					cache.stop();
					Nock.cleanAll();
				});

				it("returns the request results", function () {
					expect(result).to.have.length(2);
					expect(result[0]).to.be.an("object").that.has.property("statusCode", 404);
					expect(result[1]).to.deep.equal(payload);
				});

				describe("again", function () {
					var result;

					before(function () {
						var request = new Nock(host).get(path).reply(404, payload);
						return cache.get(host + path)
						.then(function (response) {
							result = response;
						})
						.finally(function () {
							// Error responses should not be cached.
							request.done();
						});
					});

					it("returns the request results", function () {
						expect(result).to.have.length(2);
						expect(result[0]).to.be.an("object").that.has.property("statusCode", 404);
						expect(result[1]).to.deep.equal(payload);
					});
				});
			});
		});
	});
});
