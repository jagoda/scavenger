"use strict";
var Browser = require("zombie");
var GitHub  = require("../helpers/github");
var Layout  = require("../helpers/layout");

var expect = require("chai").expect;

describe("The error page", function () {
	var browser;

	before(function () {
		browser = new Browser();
	});

	after(function () {
		browser.destroy();
	});

	describe("for an invalid URL", function () {
		before(function (done) {
			return browser.visit("/foobar", function () {
				// Ignore errors.
				done();
			});
		});

		it("uses code 404", function () {
			browser.assert.status(404);
		});

		it("has a title", function () {
			expect(browser.text("title"), "title").to.equal("Not Found - Scavenger");
		});

		it("has a navigation bar", function () {
			Layout.verifyHeader(browser);
		});

		it("has a footer", function () {
			Layout.verifyFooter(browser);
		});

		it("has a heading", function () {
			var heading = browser.query("h1");
			expect(heading, "heading element").to.exist;
			expect(heading.textContent, "heading text").to.equal("Not Found");
		});

		it("has an error message", function () {
			expect(browser.text("p"), "error message").to.match(/couldn't find/i);
		});
	});

	describe("after a server error", function () {
		var request;

		before(function (done) {
			var query   = "foo";

			request = GitHub.search.nock(query).reply(500);

			return browser.visit("/?q=" + encodeURIComponent(query), function () {
				// Ignore errors.
				done();
			});
		});

		before(function () {
			request.done();
		});

		it("uses code 500", function () {
			browser.assert.status(500);
		});

		it("has a title", function () {
			expect(browser.text("title"), "title").to.equal("Internal Server Error - Scavenger");
		});

		it("has a navigation bar", function () {
			Layout.verifyHeader(browser);
		});

		it("has a footer", function () {
			Layout.verifyFooter(browser);
		});

		it("has a heading", function () {
			var heading = browser.query("h1");
			expect(heading, "heading element").to.exist;
			expect(heading.textContent, "heading text").to.equal("Internal Server Error");
		});

		it("has an error message", function () {
			expect(browser.text("p"), "error message").to.match(/off the rails/i);
		});
	});
});
