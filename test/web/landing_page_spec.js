"use strict";
var Browser = require("zombie");
var GitHub  = require("../helpers/github");
var Layout  = require("../helpers/layout");

var expect = require("chai").expect;

describe("The landing page", function () {
	var browser;

	before(function () {
		browser = new Browser();
		return browser.visit("/");
	});

	after(function () {
		browser.destroy();
	});

	it("has a title", function () {
		expect(browser.text("title"), "title").to.equal("Scavenger");
	});

	it("has a navigation bar", function () {
		Layout.verifyHeader(browser);
	});

	it("has a footer", function () {
		Layout.verifyFooter(browser);
	});

	it("has a jumbotron", function () {
		var jumbotron = browser.query("body div.container div.jumbotron");
		expect(jumbotron, "jumbotron element").to.exist;

		var title = jumbotron.querySelector(".title");
		expect(title, "title element").to.exist;
		expect(browser.text(title), "title text").to.equal("Search for Projects");
	});

	it("has a search box", function () {
		var inputGroup = browser.query("div.jumbotron form div.input-group");
		expect(inputGroup, "input group").to.exist;

		var searchInput = inputGroup.querySelector("input.form-control");
		expect(searchInput, "input element").to.exist;
		expect(searchInput.getAttribute("type"), "input type").to.equal("text");
		expect(searchInput.getAttribute("name"), "input name").to.equal("q");
		expect(searchInput.getAttribute("value"), "input value").to.equal("");
		expect(searchInput.getAttribute("placeholder"), "input placeholder").not.to.be.empty;

		var searchButton = inputGroup.querySelector("span.input-group-btn button");
		expect(searchButton, "button element").to.exist;
		expect(searchButton.getAttribute("type"), "button type").to.equal("submit");

		var searchIcon = searchButton.querySelector("span.glyphicon.glyphicon-search");
		expect(searchIcon, "search icon").to.exist;
	});

	describe("searching for a project", function () {
		var query = "a project name";

		var request;

		before(function () {
			var results = GitHub.search.generate(0);

			request = GitHub.search.nock(query).reply(200, results);

			return browser
			.fill("div.jumbotron form input", query)
			.pressButton("div.jumbotron form button");
		});

		after(function () {
			return browser.visit("/")
			.then(function () {
				request.done();
			});
		});

		it("redirects to the search page", function () {
			browser.assert.url({
				pathname : "/",

				query : {
					q : query
				}
			});
			browser.assert.text("p", "No projects found.");
		});
	});
});
