"use strict";
var Browser = require("zombie");
var Layout  = require("../helpers/layout");

var expect = require("chai").expect;

describe("The landing page", function () {
	var browser;

	before(function () {
		browser = new Browser();
		return browser.visit("/");
	});

	it("has a title", function () {
		expect(browser.text("title"), "title").to.equal("Scavenger");
	});

	it("has a navigation bar", function () {
		Layout.verifyHeader(browser);
	});

	it("has a jumbotron", function () {
		var jumbotron = browser.query("body div.container div.jumbotron");
		expect(jumbotron, "jumbotron element").to.exist;

		var title = jumbotron.querySelector(".title");
		expect(title, "title element").to.exist;
		expect(browser.text(title), "title text").to.equal("Search for Projects");
	});
});
