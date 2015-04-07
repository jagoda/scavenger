"use strict";
var Cache        = require("../../lib/services/cache");
var Environment  = require("apparition").Environment;
var GitHub       = require("../../lib/services/github");
var GitHubHelper = require("../helpers/github");

var expect = require("chai").expect;

describe("The GitHub service", function () {
	var cache  = new Cache();
	var github = new GitHub(cache);

	var serverError = /unexpected server error \(500\)/i;

	before(function () {
		// Need to start the cache for API compliance but the cache is disabled
		// by the setup script.
		return cache.start();
	});

	after(function () {
		cache.stop();
	});

	describe("getting a project", function () {
		describe("that exists", function () {
			var project;
			var result;

			before(function () {
				project = new GitHubHelper.Project().succeed();

				return github.project(project.payload.owner.login, project.payload.name)
				.then(function (response) {
					result = response;
				})
				.finally(function () {
					project.done();
				});
			});

			it("describes the project", function () {
				expect(result).to.deep.equal(project.payload);
			});
		});

		describe("that does not exist", function () {
			var result;

			before(function () {
				var project = new GitHubHelper.Project().fail();

				return github.project(project.payload.owner.login, project.payload.name)
				.catch(function (error) {
					result = error;
				})
				.finally(function () {
					project.done();
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
				var project = new GitHubHelper.Project().fail(500);

				return github.project(project.payload.owner.login, project.payload.name)
				.catch(function (error) {
					result = error;
				})
				.finally(function () {
					project.done();
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
				return github.project("foo", "bar")
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

		describe("when configured with credentials", function () {
			var environment = new Environment();
			var token       = "atokenvalue";
			var project;

			before(function () {
				environment.set("github_token", token);
				project = new GitHubHelper.Project(token).succeed();
				return github.project(project.payload.owner.login, project.payload.name);
			});

			after(function () {
				environment.restore();
			});

			it("includes the credentials on the request", function () {
				project.done();
			});
		});
	});

	describe("finding projects", function () {
		var query = "some query";

		describe("with matching results", function () {
			var projects;
			var results;

			before(function () {
				projects = [
					new GitHubHelper.Project().succeed(),
					new GitHubHelper.Project().succeed()
				];

				var search = new GitHubHelper.Search(projects, query).succeed();

				return github.findProjects(query)
				.then(function (response) {
					results = response;
				})
				.finally(function () {
					search.done();
				});
			});

			it("returns a list of projects", function () {
				expect(results).to.have.length(projects.length);
				results.forEach(function (result, index) {
					expect(result, index).to.have.property("name", projects[index].payload.name);
				});
			});
		});

		describe("without matching results", function () {
			var result;

			before(function () {
				var search = new GitHubHelper.Search([], query).succeed();

				return github.findProjects(query)
				.then(function (response) {
					result = response;
				})
				.finally(function () {
					search.done();
				});
			});

			it("returns an empty list", function () {
				expect(result).to.deep.equal([]);
			});
		});

		describe("during a server error", function () {
			var result;

			before(function () {
				var search = new GitHubHelper.Search([], query).fail(500);

				return github.findProjects(query)
				.catch(function (error) {
					result = error;
				})
				.finally(function () {
					search.done();
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

		describe("when configured with credentials", function () {
			var environment = new Environment();
			var query       = "foo";
			var token       = "agithubtoken";
			var project;
			var search;

			before(function () {
				environment.set("github_token", token);
				project = new GitHubHelper.Project(token).succeed();
				search  = new GitHubHelper.Search([ project ], query, token).succeed();
				return github.findProjects(query);
			});

			after(function () {
				environment.restore();
			});

			it("includes the credentials on the request", function () {
				search.done();
			});
		});
	});

	describe("counting a project's contributors", function () {
		describe("with paginated results", function () {
			var list;
			var project;
			var result;

			before(function () {
				project = new GitHubHelper.Project().succeed();
				list    = new GitHubHelper.ContributorList(project, new Array(5), true).succeed();

				return github.project(project.payload.owner.login, project.payload.name)
				.then(function (project) {
					return github.contributorCount(project);
				})
				.then(function (count) {
					result = count;
				})
				.finally(function () {
					project.done();
					list.done();
				});
			});

			it("returns the number of contributors to the project", function () {
				expect(result).to.equal(list.payload.length);
			});
		});

		describe("with a single page of results", function () {
			var list;
			var project;
			var result;

			before(function () {
				project = new GitHubHelper.Project().succeed();
				list    = new GitHubHelper.ContributorList(project, new Array(5)).succeed();

				return github.project(project.payload.owner.login, project.payload.name)
				.then(function (project) {
					return github.contributorCount(project);
				})
				.then(function (count) {
					result = count;
				})
				.finally(function () {
					project.done();
					list.done();
				});
			});

			it("returns the number of contributors to the project", function () {
				expect(result).to.equal(list.payload.length);
			});
		});

		describe("failing to fetch the first page", function () {
			var list;
			var project;
			var result;

			before(function () {
				project = new GitHubHelper.Project().succeed();
				list    = new GitHubHelper.ContributorList(project, new Array(5)).fail();

				return github.project(project.payload.owner.login, project.payload.name)
				.then(function (project) {
					return github.contributorCount(project);
				})
				.catch(function (error) {
					result = error;
				})
				.finally(function () {
					project.done();
					list.done();
				});
			});

			it("fails", function () {
				expect(result).to.be.an.instanceOf(Error);
				expect(result).to.have.property("isBoom", true);
				expect(result.output.statusCode).to.equal(500);
				expect(result).to.have.property("message");
			});
		});

		describe("failing to fetch the last page", function () {
			var list;
			var project;
			var result;

			before(function () {
				project = new GitHubHelper.Project().succeed();
				list    = new GitHubHelper.ContributorList(project, new Array(5), true).fail(404);

				return github.project(project.payload.owner.login, project.payload.name)
				.then(function (project) {
					return github.contributorCount(project);
				})
				.catch(function (error) {
					result = error;
				})
				.finally(function () {
					project.done();
					list.done();
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
