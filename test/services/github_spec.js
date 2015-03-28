"use strict";
var GitHub       = require("../../lib/services/github");
var GitHubHelper = require("../helpers/github");
var Nock         = require("nock");
var Project      = require("../../lib/models/project");

var expect = require("chai").expect;

describe("The GitHub service", function () {
	var github = new GitHub();

	var serverError = /unexpected server error \(500\)/i;

	before(function () {
		Nock.disableNetConnect();
	});

	after(function () {
		Nock.enableNetConnect();
	});

	describe("getting a project", function () {
		var payload = GitHubHelper.project.generate();

		describe("that exists", function () {
			var result;

			before(function () {
				var request = GitHubHelper.project.nock(payload).reply(200, payload);

				return github.project(payload.owner.login, payload.name)
				.then(function (response) {
					result = response;
				})
				.finally(function () {
					request.done();
				});
			});

			it("describes the project", function () {
				expect(result).to.be.an.instanceOf(Project);
				expect(result).to.have.property("description", payload.description);
				expect(result).to.have.property("forks", payload.forks_count);
				expect(result).to.have.property("language", payload.language);
				expect(result).to.have.property("name", payload.name);
				expect(result).to.have.property("owner", payload.owner.login);
				expect(result).to.have.property("stargazers", payload.stargazers_count);
				expect(result).to.have.property("watchers", payload.watchers_count);
			});
		});

		describe("that does not exist", function () {
			var result;

			before(function () {
				var request = GitHubHelper.project.nock(payload).reply(404);

				return github.project(payload.owner.login, payload.name)
				.catch(function (error) {
					result = error;
				})
				.finally(function () {
					request.done();
				});
			});

			it("fails", function () {
				expect(result).to.be.an.instanceOf(Error);
				expect(result).to.have.property("isBoom", true);
				expect(result.output.statusCode).to.equal(404);
				expect(result).to.have.property("message")
				.that.is.a.match(/project '[^']+' not found/i);
			});
		});

		describe("during a server error", function () {
			var result;

			before(function () {
				var request = GitHubHelper.project.nock(payload).reply(500);

				return github.project(payload.owner.login, payload.name)
				.catch(function (error) {
					result = error;
				})
				.finally(function () {
					request.done();
				});
			});

			it("fails", function () {
				expect(result).to.be.an.instanceOf(Error);
				expect(result).to.have.property("isBoom", true);
				expect(result.output.statusCode).to.equal(500);
				expect(result).to.have.property("message")
				.that.is.a.match(serverError);
			});
		});

		describe("during a network failure", function () {
			var result;

			before(function () {
				// Nock will block the network request.
				return github.project(payload.owner.login, payload.name)
				.catch(function (error) {
					result = error;
				});
			});

			it("fails", function () {
				expect(result).to.be.an.instanceOf(Error);
				expect(result).to.have.property("isBoom", true);
				expect(result.output.statusCode).to.equal(500);
				expect(result).to.have.property("message");
			});
		});
	});

	describe("finding projects", function () {
		var query = "some query";

		describe("with matching results", function () {
			var payload = GitHubHelper.search.generate(2);

			var results;

			before(function () {
				var request = GitHubHelper.search.nock(query).reply(200, payload);

				return github.findProjects(query)
				.then(function (response) {
					results = response;
				})
				.finally(function () {
					request.done();
				});
			});

			it("returns a list of projects", function () {
				expect(results).to.have.length(2);
				results.forEach(function (result, index) {
					expect(result, index).to.be.an.instanceOf(Project);
					expect(result, index).to.have.property("name", payload.items[index].name);
				});
			});
		});

		describe("without matching results", function () {
			var payload = GitHubHelper.search.generate(0);

			var result;

			before(function () {
				var request = GitHubHelper.search.nock(query).reply(200, payload);

				return github.findProjects(query)
				.then(function (response) {
					result = response;
				})
				.finally(function () {
					request.done();
				});
			});

			it("returns an empty list", function () {
				expect(result).to.deep.equal([]);
			});
		});

		describe("during a server error", function () {
			var result;

			before(function () {
				var request = GitHubHelper.search.nock(query).reply(500);

				return github.findProjects(query)
				.catch(function (error) {
					result = error;
				})
				.finally(function () {
					request.done();
				});
			});

			it("fails", function () {
				expect(result).to.be.an.instanceOf(Error);
				expect(result).to.have.property("isBoom", true);
				expect(result.output.statusCode).to.equal(500);
				expect(result).to.have.property("message")
				.that.is.a.match(serverError);
			});
		});

		describe("during a network error", function () {
			var result;

			before(function () {
				// Nock will block the network request.
				return github.findProjects(query)
				.catch(function (error) {
					result = error;
				});
			});

			it("fails", function () {
				expect(result).to.be.an.instanceOf(Error);
				expect(result).to.have.property("isBoom", true);
				expect(result.output.statusCode).to.equal(500);
				expect(result).to.have.property("message");
			});
		});
	});
});