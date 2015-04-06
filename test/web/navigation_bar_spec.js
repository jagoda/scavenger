"use strict";
var Bluebird = require("bluebird");
var Browser  = require("zombie");
var GitHub   = require("../helpers/github");

describe("The navigation bar", function () {
	var browser;

	before(function () {
		browser = new Browser();
	});

	after(function () {
		browser.destroy();
	});

	describe("traversing the brand link", function () {
		before(function () {
			return Bluebird.fromNode(function (callback) {
				browser.visit("/foo", callback);
			})
			// Ignore errors.
			.catch(function () {})
			.then(function () {
				browser.click("nav a.navbar-brand");
			});
		});

		it("navigates to the landing page", function () {
			browser.assert.url({ pathname : "/" });
		});
	});

	describe("using the search bar", function () {
		var query = "a package";

		before(function () {
			var search = new GitHub.Search([], query).succeed();

			return Bluebird.fromNode(function (callback) {
				browser.visit("/foo", callback);
			})
			// Ignore errors.
			.catch(function () {})
			.then(function () {
				return browser.fill("nav form input", query);
			})
			.then(function () {
				return browser.fire("nav form", "submit");
			})
			.then(function () {
				search.done();
			});
		});

		it("redirects to the search page", function () {
			browser.assert.url({
				pathname : "/",

				query : {
					q : query
				}
			});
		});
	});
});
