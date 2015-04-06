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
			browser.visit("/foobar", function () {
				// Ignore errors.
				done();
			});
		});

		it("is an error page", function () {
			Layout.errorPage(browser, 404);
		});

		it("has an error message", function () {
			expect(browser.text("p"), "error message").to.match(/couldn't find/i);
		});
	});

	describe("after a server error", function () {
		var request;

		before(function (done) {
			var query = "foo";

			request = new GitHub.Search([], query).fail(500);

			browser.visit("/?q=" + encodeURIComponent(query), function () {
				// Ignore errors.
				done();
			});
		});

		before(function () {
			request.done();
		});

		it("is an error page", function () {
			Layout.errorPage(browser, 500);
		});

		it("has an error message", function () {
			expect(browser.text("p"), "error message").to.match(/off the rails/i);
		});
	});
});
