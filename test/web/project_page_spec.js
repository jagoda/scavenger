"use strict";
var Bluebird = require("bluebird");
var Browser  = require("zombie");
var GitHub   = require("../helpers/github");
var Layout   = require("../helpers/layout");
var Numeral  = require("numeral");

var expect = require("chai").expect;

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
			return browser.visit(project.url())
			.then(function () {
				project.done();
				contributors.done();
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
			var heading = browser.query("h3");
			expect(heading, "heading element").to.exist;
			expect(heading.textContent, "heading text").to.equal("Overview");

			var table = browser.query("h3+div.table");
			expect(table, "table element").to.exist;

			var rows = [
				[
					"Stars: " + new Numeral(project.payload.stargazers_count).format(numberFormat),
					"Forks: " + new Numeral(project.payload.forks_count).format(numberFormat),
					"Contributors: " + new Numeral(contributors.payload.length),
					"Watchers: " + new Numeral(project.payload.subscribers_count)
						.format(numberFormat)
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

	describe("traversing the project link (name)", function () {
		var project;

		before(function () {
			project = new GitHub.Project().succeed();

			var contributors = new GitHub.ContributorList(project, []).succeed();

			return browser.visit(project.url())
			.then(function () {
				contributors.done();
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
