"use strict";
var GitHub       = require("../../lib/services/github");
var GitHubHelper = require("../helpers/github");
var MongoHelper  = require("../helpers/mongo");
var Npm          = require("../../lib/services/npm");
var NpmHelper    = require("../helpers/npm");
var UrlCache     = require("../../lib/services/url_cache");

var expect = require("chai").expect;

describe("The NPM service", function () {
	var cache  = new UrlCache();
	var github = new GitHub(cache);
	var npm    = new Npm(cache);

	before(function () {
		return cache.start();
	});

	after(function () {
		return cache.stop()
		.then(function () {
			return MongoHelper.dropDatabase();
		});
	});

	describe("matching a project", function () {
		describe("with a 'package.json' file", function () {
			var fileList = [
				{
					path : "package.json"
				}
			];

			var result;

			before(function () {
				var project = new GitHubHelper.Project().succeed();
				var files   = new GitHubHelper.Files(project, fileList).succeed();

				return github.project(project.payload.owner.login, project.payload.name)
				.then(function (project) {
					return npm.match(project);
				})
				.then(function (matches) {
					result = matches;
				})
				.finally(function () {
					project.done();
					files.done();
				});
			});

			it("succeeds", function () {
				expect(result).to.be.true;
			});
		});

		describe("without a 'package.json' file", function () {
			var result;

			before(function () {
				var project = new GitHubHelper.Project().succeed();
				var files   = new GitHubHelper.Files(project).succeed();

				return github.project(project.payload.owner.login, project.payload.name)
				.then(function (project) {
					return npm.match(project);
				})
				.then(function (matches) {
					result = matches;
				})
				.finally(function () {
					project.done();
					files.done();
				});
			});

			it("fails", function () {
				expect(result).to.be.false;
			});
		});

		describe("during a server error", function () {
			var result;

			before(function () {
				var project = new GitHubHelper.Project().succeed();
				var files   = new GitHubHelper.Files(project).fail();

				return github.project(project.payload.owner.login, project.payload.name)
				.then(function (project) {
					return npm.match(project);
				})
				.catch(function (error) {
					result = error;
				})
				.finally(function () {
					project.done();
					files.done();
				});
			});

			it("fails", function () {
				expect(result).to.be.a.serviceError;
			});
		});

		describe("during a network error", function () {
			var result;

			before(function () {
				var project = new GitHubHelper.Project().succeed();

				return github.project(project.payload.owner.login, project.payload.name)
				.then(function (project) {
					// Nock will block the network request.
					return npm.match(project);
				})
				.catch(function (error) {
					result = error;
				})
				.finally(function () {
					project.done();
				});
			});

			it("fails", function () {
				expect(result).to.be.a.serivceError;
			});
		});
	});

	describe("getting the 30 day download count", function () {
		describe("with a valid package manifest", function () {
			var result;

			before(function () {
				var project   = new GitHubHelper.Project().succeed();
				var downloads = new NpmHelper.Downloads(project).succeed();

				return github.project(project.payload.owner.login, project.payload.name)
				.then(function (project) {
					return npm.downloads(project);
				})
				.then(function (downloads) {
					result = downloads;
				})
				.finally(function () {
					project.done();
					downloads.done();
				});
			});

			it("returns the number of downloads", function () {
				expect(result).to.equal(42);
			});
		});

		describe("with an invalid package manifest", function () {
			var result;

			before(function () {
				var project   = new GitHubHelper.Project().succeed();
				var downloads = new NpmHelper.Downloads(project, { invalid : true }).succeed();

				return github.project(project.payload.owner.login, project.payload.name)
				.then(function (project) {
					return npm.downloads(project);
				})
				.catch(function (error) {
					result = error;
				})
				.finally(function () {
					project.done();
					downloads.done();
				});
			});

			it("fails", function () {
				expect(result).to.be.a.serviceError;
			});
		});

		describe("with a server error", function () {
			var result;

			before(function () {
				var project   = new GitHubHelper.Project().succeed();
				var downloads = new NpmHelper.Downloads(project).fail();

				return github.project(project.payload.owner.login, project.payload.name)
				.then(function (project) {
					return npm.downloads(project);
				})
				.catch(function (error) {
					result = error;
				})
				.finally(function () {
					project.done();
					downloads.done();
				});
			});

			it("fails", function () {
				expect(result).to.be.a.serviceError;
			});
		});

		describe("with a network error", function () {
			var result;

			before(function () {
				var project   = new GitHubHelper.Project().succeed();

				return github.project(project.payload.owner.login, project.payload.name)
				.then(function (project) {
					// Nock will block the request.
					return npm.downloads(project);
				})
				.catch(function (error) {
					result = error;
				})
				.finally(function () {
					project.done();
				});
			});

			it("fails", function () {
				expect(result).to.be.a.serviceError;
			});
		});
	});
});
