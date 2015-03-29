"use strict";
var Browser = require("zombie");
var Layout  = require("./layout");
var URL     = require("./url");

var expect = require("chai").expect;

describe("The layout helper", function () {
	var browser;

	before(function () {
		browser = new Browser();
	});

	after(function () {
		browser.destroy();
	});

	describe("detecting a navigation bar", function () {
		var fixture = URL.fixture("navbar.html");

		before(function () {
			return browser.visit(fixture);
		});

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

	describe("detecting a footer", function () {
		var fixture = URL.fixture("footer.html");

		describe("on a page with a valid footer", function () {
			before(function () {
				return browser.visit(fixture);
			});

			it("succeeds", function () {
				Layout.verifyFooter(browser);
			});
		});

		describe("with an invalid structure", function () {
			before(function () {
				return browser.visit(fixture);
			});

			it("fails", function () {
				var elements = browser.query("body").querySelectorAll("*");

				// Skip first DIV.
				for (var i = 1; i < elements.length; i += 1) {
					var current = elements.item(i);
					var parent  = current.parentNode;
					parent.removeChild(current);
					expect(Layout.verifyFooter.bind(Layout, browser), current.nodeName).to.throw();
					parent.appendChild(current);
				}
			});
		});

		describe("with invalid reset link text", function () {
			before(function () {
				return browser.visit(fixture)
				.then(function () {
					var reset = browser.query("div:last-of-type span.navbar-right a");
					reset.textContent = "foo";
				});
			});

			it("fails", function () {
				expect(Layout.verifyFooter.bind(Layout, browser)).to.throw();
			});
		});

		describe("with invalid reset link href", function () {
			before(function () {
				return browser.visit(fixture)
				.then(function () {
					var reset = browser.query("div:last-of-type span.navbar-right a");
					reset.href = "foo";
				});
			});

			it("fails", function () {
				expect(Layout.verifyFooter.bind(Layout, browser)).to.throw();
			});
		});
	});

	describe("detecting an error page", function () {
		describe("when on an error page", function () {
			before(function (done) {
				browser.visit("/foo", function () {
					// Ignore errors.
					done();
				});
			});

			it("succeeds", function () {
				Layout.errorPage(browser, 404);
			});
		});

		describe("when on a different error page", function () {
			before(function (done) {
				browser.visit("/foo", function () {
					// Ignore errors.
					done();
				});
			});

			it("fails", function () {
				expect(Layout.errorPage.bind(Layout, browser, 500)).to.throw();
			});
		});

		describe("when on a regular page", function () {
			before(function () {
				return browser.visit("/");
			});

			it("fails", function () {
				expect(Layout.errorPage.bind(Layout, browser, 404)).to.throw();
			});
		});
	});
});
