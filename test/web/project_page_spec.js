"use strict";
var Bluebird = require("bluebird");
var Browser  = require("zombie");
var GitHub   = require("../helpers/github");
var Layout   = require("../helpers/layout");
var Numeral  = require("numeral");
var URL      = require("../helpers/url");
var Util     = require("util");

var expect = require("chai").expect;

describe("A project page", function () {
	var project      = GitHub.project.generate();
	var projectUrl   = URL.project(project.owner.login, project.name);
	var githubUrl    = Util.format("https://github.com/%s/%s", project.owner.login, project.name);
	var numberFormat = "0,0";

	var browser;

	before(function () {
		browser = new Browser();
	});

	after(function () {
		browser.destroy();
	});

	describe("for a project that exists", function () {
		before(function () {
			var request = GitHub.project.nock(project).reply(200, project);

			return browser.visit(projectUrl)
			.then(function () {
				request.done();
			});
		});

		it("has a title", function () {
			expect(browser.text("title"), "title").to.equal(project.name + " - Scavenger");
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
			.to.equal(project.owner.login + "/" + project.name);

			var projectLink = heading.querySelector("a:nth-of-type(1)");
			var githubUrl   = Util.format(
				"https://github.com/%s/%s",
				project.owner.login,
				project.name
			);
			expect(projectLink, "project element").to.exist;
			expect(projectLink.getAttribute("href"), "project href").to.equal(githubUrl);

			var octicon = projectLink.querySelector("span.mega-octicon.octicon-mark-github");
			expect(octicon, "GitHub icon").to.exist;
		});

		it("includes the project description", function () {
			browser.assert.text("h2+p", project.description);
		});

		it("has a table of statistics", function () {
			var heading = browser.query("h3");
			expect(heading, "heading element").to.exist;
			expect(heading.textContent, "heading text").to.equal("Overview");

			var table = browser.query("h3+div.table");
			expect(table, "table element").to.exist;

			var rows = [
				[
					"Stars: " + new Numeral(project.stargazers_count).format(numberFormat),
					"Forks: " + new Numeral(project.forks_count).format(numberFormat),
					"Watchers: " + new Numeral(project.watchers_count).format(numberFormat)
				]
			];

			for (var i = 0; i < rows.length; i += 1) {
				var row = table.querySelector("div.row:nth-of-type(" + i + 1 + ")");
				expect(row, "row " + i).to.exist;
				var cells = row.querySelectorAll("div");
				expect(cells, "cells " + i).to.have.length(rows[i].length);

				for (var j = 0; j < rows[i].length; j += 1) {
					var element = cells.item(j);
					expect(element.textContent.trim(), i + "," + j)
					.to.equal(rows[i][j]);
				}
			}
		});
	});

	describe("for a project that does not exist", function () {
		var request;

		before(function () {
			request = GitHub.project.nock(project).reply(404);

			return Bluebird.fromNode(function (callback) {
				browser.visit(projectUrl, callback);
			})
			// Ignore errors.
			.catch(function () {});
		});

		before(function () {
			request.done();
		});

		it("shows an error page", function () {
			Layout.errorPage(browser, 404);
		});
	});

	describe("traversing the project link (name)", function () {
		before(function () {
			var request = GitHub.project.nock(project).reply(200, project);
			return browser.visit(projectUrl)
			.then(function () {
				request.done();
				return Bluebird.fromNode(function (callback) {
					browser.click("h2 a:nth-of-type(1)", callback);
				})
				// Ignore errors.
				.catch(function () {});
			});
		});

		it("redirects to the GitHub project page", function () {
			browser.assert.url(githubUrl);
		});
	});
});
