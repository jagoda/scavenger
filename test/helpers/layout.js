"use strict";
var Layout = module.exports;

var expect = require("chai").expect;

Layout.verifyHeader = function (browser) {
	var brand = browser.query("nav>div.container-fluid>div.navbar-header>a.navbar-brand");
	expect(brand, "brand element").to.exist;
	expect(browser.text(brand), "brand text").to.equal("Scavenger");
	expect(brand.getAttribute("href"), "brand href").to.equal("/");
};
