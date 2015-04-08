"use strict";
var Bluebird = require("bluebird");
var Browser  = require("zombie");
var GitHub   = require("../helpers/github");
var Layout   = require("../helpers/layout");
var Numeral  = require("numeral");

var expect = require("chai").expect;
var _      = require("lodash");

describe("A project page", function () {
	var numberFormat = "0,0";
	var browser;

	before(function () {
		browser = new Browser();
	});

	after(function () {
		browser.destroy();
	});

	describe("for a project that exists", function () {
		var contributors;
		var project;

		before(function () {
			project      = new GitHub.Project().succeed();
			contributors = new GitHub.ContributorList(project, new Array(5)).succeed();

			var files = new GitHub.Files(
				project,
				[
					{
						path     : "README.md",
						html_url : "https://github.com"
					},
					{
						path     : "CONTRIBUTING",
						html_url : "https://github.com"
					},
					{
						path     : "CHANGELOG",
						html_url : "https://github.com"
					}
				]
			).succeed();

			var participation = new GitHub.CommitHistory(project).succeed();

			return browser.visit(project.url())
			.then(function () {
				project.done();
				contributors.done();
				files.done();
				participation.done();
			});
		});

		it("has a title", function () {
			expect(browser.text("title"), "title").to.equal(project.payload.name + " - Scavenger");
		});

		it("has a navigation bar", function () {
			Layout.verifyHeader(browser);
		});

		it("has a footer", function () {
			Layout.verifyFooter(browser);
		});

		it("has a heading", function () {
			var heading = browser.query("h2");
			expect(heading, "heading element").to.exist;
			expect(heading.textContent.trim(), "heading text")
			.to.equal(project.payload.owner.login + "/" + project.payload.name);

			var projectLink = heading.querySelector("a:nth-of-type(1)");
			expect(projectLink, "project element").to.exist;
			expect(projectLink.getAttribute("href"), "project href").to.equal(project.githubUrl());

			var octicon = projectLink.querySelector("span.mega-octicon.octicon-mark-github");
			expect(octicon, "GitHub icon").to.exist;
		});

		it("includes the project description", function () {
			browser.assert.text("h2+p", project.payload.description);
		});

		it("has a table of statistics", function () {
			var table = browser.query("div.table");
			expect(table, "table element").to.exist;

			var rows = [
				[
					"Split: 0.00%",
					"Contributors: " + new Numeral(contributors.payload.length)
						.format(numberFormat),
					"Forks: " + new Numeral(project.payload.forks_count).format(numberFormat),
					"Stars: " + new Numeral(project.payload.stargazers_count).format(numberFormat),
					"Subscribers: " + new Numeral(project.payload.subscribers_count)
						.format(numberFormat)
				],
				[
					"License: MIT License",
					"Readme: Yes",
					"Contributing: Yes",
					"Changelog: Yes"
				]
			];

			var rowElements = table.querySelectorAll("div.row");
			for (var i = 0; i < rows.length; i += 1) {
				var row = rowElements.item(i);
				expect(row, "row " + i).to.exist;
				var cells = row.querySelectorAll("div");
				expect(cells, "cells " + i).to.have.length(rows[i].length);

				for (var j = 0; j < rows[i].length; j += 1) {
					var element = cells.item(j);
					expect(element.textContent.replace(/\s+/g, " ").trim(), i + "," + j)
					.to.equal(rows[i][j]);
				}
			}
		});

		describe("fetched multiple times in quick succession", function () {
			it("caches computed values", function () {
				// This should error if a network request is made.
				return browser.visit(project.url());
			});
		});
	});

	describe("for a project that does not exist", function () {
		before(function () {
			var project = new GitHub.Project().fail();
			return Bluebird.fromNode(function (callback) {
				browser.visit(project.url(), callback);
			})
			// Ignore errors.
			.catch(function () {})
			.then(function () {
				project.done();
			});
		});

		it("shows an error page", function () {
			Layout.errorPage(browser, 404);
		});
	});

	describe("for a project with an unknown license", function () {
		before(function () {
			var project       = new GitHub.Project();
			var contributors  = new GitHub.ContributorList(project).succeed();
			var files         = new GitHub.Files(project).succeed();
			var participation = new GitHub.CommitHistory(project).succeed();

			delete project.payload.license;
			project.succeed();

			return browser.visit(project.url())
			.then(function () {
				project.done();
				contributors.done();
				files.done();
				participation.done();
			});
		});

		it("uses 'Unknown' for the license value", function () {
			var license = browser.query("div.row:nth-of-type(2) div:nth-of-type(1)");
			expect(license.textContent).to.match(/\s+Unknown\s+$/);
		});
	});

	describe("missing", function () {
		var files = [
			{
				path     : "README.md",
				html_url : "http://example.com"
			},
			{
				path     : "CONTRIBUTING.md",
				html_url : "http://example.com"
			},
			{
				path     : "CHANGELOG.md",
				html_url : "http://example.com"
			}
		];

		describe("the README file", function () {
			var noReadme = _.reject(files, function (file) {
				return /^README/.test(file.path);
			});

			before(function () {
				var project       = new GitHub.Project().succeed();
				var contributors  = new GitHub.ContributorList(project).succeed();
				var files         = new GitHub.Files(project, noReadme).succeed();
				var participation = new GitHub.CommitHistory(project).succeed();

				return browser.visit(project.url())
				.then(function () {
					project.done();
					contributors.done();
					files.done();
					participation.done();
				});
			});

			it("uses 'No' for the Readme value", function () {
				var readme = browser.query("div.row:nth-of-type(2) div:nth-of-type(2)");
				expect(readme.textContent).to.match(/\s+No\s+$/);
			});
		});

		describe("the CHANGELOG file", function () {
			var noChangelog = _.reject(files, function (file) {
				return /^CHANGELOG/.test(file.path);
			});

			before(function () {
				var project       = new GitHub.Project().succeed();
				var contributors  = new GitHub.ContributorList(project).succeed();
				var files         = new GitHub.Files(project, noChangelog).succeed();
				var participation = new GitHub.CommitHistory(project).succeed();

				return browser.visit(project.url())
				.then(function () {
					project.done();
					contributors.done();
					files.done();
					participation.done();
				});
			});

			it("uses 'No' for the Changelog value", function () {
				var changelog = browser.query("div.row:nth-of-type(2) div:nth-of-type(4)");
				expect(changelog.textContent).to.match(/\s+No\s+$/);
			});
		});

		describe("the CONTRIBUTING file", function () {
			var noContributing = _.reject(files, function (file) {
				return /^CONTRIBUTING/.test(file.path);
			});

			before(function () {
				var project       = new GitHub.Project().succeed();
				var contributors  = new GitHub.ContributorList(project).succeed();
				var files         = new GitHub.Files(project, noContributing).succeed();
				var participation = new GitHub.CommitHistory(project).succeed();

				return browser.visit(project.url())
				.then(function () {
					project.done();
					contributors.done();
					files.done();
					participation.done();
				});
			});

			it("uses 'No' for the Contributing value", function () {
				var contributing = browser.query("div.row:nth-of-type(2) div:nth-of-type(3)");
				expect(contributing.textContent).to.match(/\s+No\s+$/);
			});
		});
	});

	describe("traversing the project link (name)", function () {
		var project;

		before(function () {
			project = new GitHub.Project().succeed();

			var contributors  = new GitHub.ContributorList(project).succeed();
			var files         = new GitHub.Files(project).succeed();
			var participation = new GitHub.CommitHistory(project).succeed();

			return browser.visit(project.url())
			.then(function () {
				contributors.done();
				files.done();
				participation.done();
				project.done();

				return Bluebird.fromNode(function (callback) {
					browser.click("h2 a:nth-of-type(1)", callback);
				})
				// Ignore errors.
				.catch(function () {});
			});
		});

		it("redirects to the GitHub project page", function () {
			browser.assert.url(project.githubUrl());
		});
	});
});
