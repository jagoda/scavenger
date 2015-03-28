"use strict";
var Layout = module.exports;

var expect = require("chai").expect;

Layout.verifyFooter = function (browser) {
	var reset = browser.query("div.navbar:last-of-type span.navbar-text.navbar-right a");
	expect(reset, "reset element").to.exist;
	expect(reset.getAttribute("href"), "reset href").to.equal("#");
	expect(reset.textContent, "reset text").to.equal("Back to top");
};

Layout.verifyHeader = function (browser) {
	var brand = browser.query("nav>div.container>div.navbar-header>a.navbar-brand");
	expect(brand, "brand element").to.exist;
	expect(browser.text(brand), "brand text").to.equal("Scavenger");
	expect(brand.getAttribute("href"), "brand href").to.equal("/");
};
