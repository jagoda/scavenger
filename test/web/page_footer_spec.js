"use strict";
var Bluebird = require("bluebird");
var Browser  = require("zombie");

describe("The page footer", function () {
	var browser;

	before(function () {
		browser = new Browser();
	});

	after(function () {
		browser.destroy();
	});

	describe("returning to the top of the page", function () {
		before(function () {
			return Bluebird.fromNode(function (callback) {
				browser.visit("/foo", callback);
			})
			// Ignore errors.
			.catch(function () {})
			.then(function () {
				return browser.clickLink("Back to top");
			});
		});

		it("navigates to an empty anchor", function () {
			browser.assert.url("/foo#");
		});
	});
});
