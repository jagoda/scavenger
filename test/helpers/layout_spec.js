"use strict";
var Browser = require("zombie");
var Layout  = require("./layout");
var URL     = require("./url");

var expect = require("chai").expect;

describe("The layout helper", function () {
	var browser = new Browser();

	describe("detecting a navigation bar", function () {
		var fixture = URL.fixture("navbar.html");

		describe("on a page with a valid navigation bar", function () {
			before(function () {
				return browser.visit(fixture);
			});

			it("succeeds", function () {
				Layout.verifyHeader(browser);
			});
		});

		describe("with an invalid structure", function () {
			before(function () {
				return browser.visit(fixture);
			});

			it("fails", function () {
				var elements = browser.query("body").querySelectorAll("*");

				var current;
				var parent;

				for (var i = 0; i < elements.length; i += 1) {
					current = elements.item(i);
					parent  = current.parentNode;
					parent.removeChild(current);
					expect(Layout.verifyHeader.bind(Layout, browser), current.nodeName).to.throw();
					parent.appendChild(current);
				}
			});
		});

		describe("with an invalid brand", function () {
			before(function () {
				return browser.visit(fixture);
			});

			before(function () {
				var brand = browser.query("nav .navbar-header a.navbar-brand");

				brand.textContent = "foo";
			});

			it("fails", function () {
				expect(Layout.verifyHeader.bind(Layout, browser)).to.throw();
			});
		});

		describe("with an invalid brand URL", function () {
			before(function () {
				return browser.visit(fixture);
			});

			before(function () {
				var brand = browser.query("nav .navbar-header a.navbar-brand");

				brand.href = "/foo";
			});

			it("fails", function () {
				expect(Layout.verifyHeader.bind(Layout, browser)).to.throw();
			});
		});
	});
});
