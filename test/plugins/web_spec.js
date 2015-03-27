"use strict";
var Bluebird = require("bluebird");
var Hapi     = require("hapi");
var Web      = require("../../lib/plugins/web");

var expect = require("chai").expect;

Bluebird.promisifyAll(Hapi);

describe("The web plugin", function () {
	it("is a Hapi plugin", function () {
		expect(Web, "plugin")
		.to.have.property("register").that.is.a("function")
		.that.has.property("attributes")
		.that.has.property("name", "web");
	});
});
