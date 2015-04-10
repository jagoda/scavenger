"use strict";
var Browser = require("zombie");
var GitHub  = require("../helpers/github");
var Layout  = require("../helpers/layout");

var expect = require("chai").expect;

describe("The search page", function () {
	var browser;

	before(function () {
		browser = new Browser();
	});

	after(function () {
		browser.destroy();
	});

	describe("with results", function () {
		var query = "a query";
		var results;

		before(function () {
			results = [
				new GitHub.Project().succeed(),
				new GitHub.Project().succeed(),
				new GitHub.Project().succeed()
			];

			var search = new GitHub.Search(results, query).succeed();

			return browser.visit("/?q=" + encodeURIComponent(query))
			.then(function () {
				search.done();
			});
		});

		it("has a title", function () {
			expect(browser.text("title"), "title").to.equal(query + " - Scavenger");
		});

		it("has a navigation bar", function () {
			Layout.verifyHeader(browser);
		});

		it("has a footer", function () {
			Layout.verifyFooter(browser);
		});

		it("has a search box", function () {
			var inputGroup = browser.query("div.well form div.input-group");
			expect(inputGroup, "input group").to.exist;

			var searchInput = inputGroup.querySelector("input.form-control");
			expect(searchInput, "input element").to.exist;
			expect(searchInput.getAttribute("type"), "input type").to.equal("text");
			expect(searchInput.getAttribute("name"), "input name").to.equal("q");
			expect(searchInput.getAttribute("value"), "input value").to.equal(query);
			expect(searchInput.getAttribute("placeholder"), "input placeholder").not.to.be.empty;

			var searchButton = inputGroup.querySelector("span.input-group-btn button");
			expect(searchButton, "button element").to.exist;
			expect(searchButton.getAttribute("type"), "button type").to.equal("submit");

			var searchIcon = searchButton.querySelector("span.glyphicon.glyphicon-search");
			expect(searchIcon, "search icon").to.exist;
		});

		it("has a table of results", function () {
			var table = browser.query("table.table");
			expect(table, "table element").to.exist;

			var projectHeader = table.querySelector("thead tr th:nth-of-type(1)");
			expect(projectHeader, "project header element").to.exist;
			expect(projectHeader.textContent, "project header text").to.equal("Project");

			var descriptionHeader = table.querySelector("th:nth-of-type(2)");
			expect(descriptionHeader, "description header element").to.exist;
			expect(descriptionHeader.textContent, "description header text")
			.to.equal("Description");

			var rows = table.querySelectorAll("tbody tr");
			expect(rows, "rows").to.have.length(results.length);
			for (var i = 0; i < rows.length; i += 1) {
				var item        = rows.item(i);
				var name        = item.querySelector("td:nth-of-type(1) a");
				var description = item.querySelector("td:nth-of-type(2)");
				expect(name, "name element").to.exist;
				expect(name.textContent, "name text")
				.to.equal(results[i].payload.owner.login + "/" + results[i].payload.name);
				expect(name.getAttribute("href"), "name link")
				.to.equal("/" + results[i].payload.owner.login + "/" + results[i].payload.name);
				expect(description, "description element").to.exist;
				expect(description.textContent, "description text")
				.to.equal(results[i].payload.description);
			}
		});
	});

	describe("without results", function () {
		var query = "another query";

		before(function () {
			var search = new GitHub.Search([], query).succeed();

			return browser.visit("/?q=" + encodeURIComponent(query))
			.then(function () {
				search.done();
			});
		});

		it("has a title", function () {
			expect(browser.text("title"), "title").to.equal(query + " - Scavenger");
		});

		it("has a navigation bar", function () {
			Layout.verifyHeader(browser);
		});

		it("has a footer", function () {
			Layout.verifyFooter(browser);
		});

		it("has a search box", function () {
			var inputGroup = browser.query("div.well form div.input-group");
			expect(inputGroup, "input group").to.exist;

			var searchInput = inputGroup.querySelector("input.form-control");
			expect(searchInput, "input element").to.exist;
			expect(searchInput.getAttribute("type"), "input type").to.equal("text");
			expect(searchInput.getAttribute("name"), "input name").to.equal("q");
			expect(searchInput.getAttribute("value"), "input value").to.equal(query);
			expect(searchInput.getAttribute("placeholder"), "input placeholder").not.to.be.empty;

			var searchButton = inputGroup.querySelector("span.input-group-btn button");
			expect(searchButton, "button element").to.exist;
			expect(searchButton.getAttribute("type"), "button type").to.equal("submit");

			var searchIcon = searchButton.querySelector("span.glyphicon.glyphicon-search");
			expect(searchIcon, "search icon").to.exist;
		});

		it("does not have a table of results", function () {
			var table = browser.query("table.table");
			expect(table, "table element").not.to.exist;

			var message = browser.query("p");
			expect(message, "message element").to.exist;
			expect(message.textContent, "message text").to.match(/no projects/i);
		});
	});

	describe("navigating to a search result", function () {
		var query = "an arbitrary query";
		var project;

		before(function () {
			project           = new GitHub.Project().succeed();
			var contributors  = new GitHub.ContributorList(project).succeed();
			var downloads     = new GitHub.Files(project).succeed();
			var files         = new GitHub.Files(project).succeed();
			var participation = new GitHub.CommitHistory(project).succeed();
			var search        = new GitHub.Search([ project ], query).succeed();

			return browser.visit("/?q=" + encodeURIComponent(query))
			.then(function () {
				var link = browser.query("table tbody td a");
				expect(link, "link element").to.exist;
				return browser.pressButton(link);
			})
			.then(function () {
				contributors.done();
				downloads.done();
				files.done();
				participation.done();
				project.done();
				search.done();
			});
		});

		it("navigates to the project page", function () {
			var fullName = project.payload.owner.login + "/" + project.payload.name;

			browser.assert.url({
				pathname : "/" + fullName
			});
			browser.assert.text("h2", fullName);
		});
	});
});
