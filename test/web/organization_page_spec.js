"use strict";
var Bluebird = require("bluebird");
var Browser  = require("zombie");
var GitHub   = require("../helpers/github");
var Layout   = require("../helpers/layout");
var Npm      = require("../helpers/npm");
var Numeral  = require("numeral");
var Util     = require("util");

var expect = require("chai").expect;

describe("An organization page", function () {
	var browser;

	function numeral (value) {
		return new Numeral(value).format("0,0");
	}

	before(function () {
		browser = new Browser();
	});

	after(function () {
		browser.destroy();
	});

	describe("for an organization that exists", function () {
		var organization;

		function fileList (project) {
			return [
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
				},
				{
					path         : "package.json",
					download_url : Util.format(
						"https://raw.githubusercontent.com/%s/%s/master/package.json",
						project.payload.owner.login,
						project.payload.name
					)
				}
			];
		}

		before(function () {
			organization = new GitHub.Organization().succeed();

			organization.projects.forEach(function (project) {
				project.succeed();
				project.contributors  = new GitHub.ContributorList(project).succeed();
				project.downloads     = new Npm.Downloads(project, fileList(project)).succeed();
				project.files         = new GitHub.Files(project, fileList(project)).succeed();
				project.participation = new GitHub.CommitHistory(project).succeed();
			});

			browser.visit(organization.url());
			return browser.wait({
				function : function () {
					return "Please Wait" === browser.text("title");
				}
			});
		});

		it("initially shows a placeholder page", function () {
			expect(browser.text("title")).to.equal("Please Wait");
			expect(browser.text("h2")).to.equal("Hang Tight!");
			expect(browser.text("p")).to.contain("need a minute");
		});

		describe("after warming the cache", function () {
			before(function () {
				return browser.wait()
				.then(function () {
					organization.done();
					organization.projects.forEach(function (project) {
						project.done();
						project.contributors.done();
						project.downloads.done();
						project.files.done();
						project.participation.done();
					});
				});
			});

			it("has a title", function () {
				expect(browser.text("title")).to.equal(organization.payload.name + " - Scavenger");
			});

			it("has a navigation bar", function () {
				Layout.verifyHeader(browser);
			});

			it("has a footer", function () {
				Layout.verifyFooter(browser);
			});

			it("has a heading", function () {
				var heading = browser.query("h2 a");
				expect(heading, "heading element").to.exist;
				expect(heading.textContent.trim(), "heading text")
				.to.equal(organization.payload.name);

				expect(heading.getAttribute("href"), "heading href")
				.to.equal(organization.githubUrl());

				var octicon = heading.querySelector("span.mega-octicon.octicon-mark-github");
				expect(octicon, "GitHub icon").to.exist;
			});

			it("has a table of projects", function () {
				var headings = [
					"Project", "Split", "Downloads", "License", "Readme", "Contributing",
					"Changelog", "Contributors", "Forks", "Stars", "Subscribers"
				];

				var table = browser.query("table.table");
				expect(table, "table element").to.exist;

				var tableHeadings = table.querySelectorAll("thead th span.octicon");
				expect(tableHeadings, "headings").to.have.length(headings.length);
				headings.forEach(function (title, index) {
					expect(tableHeadings.item(index).getAttribute("title"), "title " + index)
					.to.equal(title);
				});

				var tableRows = table.querySelectorAll("tbody tr");
				expect(tableRows, "rows").to.have.length(2);
				organization.payload.forEach(function (project, index) {
					var columns = tableRows.item(index).querySelectorAll("td");
					var name    = columns.item(0).querySelector("a");

					expect(columns, "column elements").to.have.length(11);
					expect(name.textContent, "name").to.equal(project.name);
					expect(name.getAttribute("href"), "project link").to.equal(
						[ "", organization.payload.name, project.name ].join("/")
					);
					expect(columns.item(1).textContent, "split").to.equal("0.00%");
					expect(columns.item(2).textContent, "downloads").to.equal("42,000");
					expect(columns.item(3).textContent, "license").to.equal(project.license.name);
					expect(columns.item(4).textContent, "readme").to.equal("Yes");
					expect(columns.item(5).textContent, "contributing").to.equal("Yes");
					expect(columns.item(6).textContent, "changelog").to.equal("Yes");
					expect(columns.item(7).textContent, "contributors").to.equal("0");
					expect(columns.item(8).textContent, "forks")
					.to.equal(numeral(project.forks_count));
					expect(columns.item(9).textContent, "stars")
					.to.equal(numeral(project.stargazers_count));
					expect(columns.item(10).textContent, "subscribers")
					.to.equal(numeral(project.subscribers_count));
				});
			});
		});
	});

	describe("for an organization that does not exist", function () {
		before(function () {
			var organization = new GitHub.Organization().fail();

			return Bluebird.fromNode(function (callback) {
				browser.visit(organization.url(), callback);
			})
			// Ignore errors
			.catch(function () {})
			.finally(function () {
				organization.done();
			});
		});

		it("shows an error page", function () {
			Layout.errorPage(browser, 404);
		});
	});

	describe("during an intermittent failure", function () {
		before(function () {
			var organization = new GitHub.Organization().succeed();

			return Bluebird.fromNode(function (callback) {
				browser.visit(organization.url(), callback);
			})
			// Ignore errors
			.catch(function () {})
			.finally(function () {
				organization.done();
			});
		});

		it("shows an error page", function () {
			Layout.errorPage(browser, 500);
		});
	});
});
