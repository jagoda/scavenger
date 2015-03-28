"use strict";
var Bluebird  = require("bluebird");
var Request   = require("apparition").Request;
var Scavenger = require("../../lib/server");

var expect = require("chai").expect;

describe("The static resources", function () {
	it("include bootstrap", function () {
		var javascript = new Request(
			"get",
			"/static/bower_components/bootstrap/dist/js/bootstrap.min.js"
		);

		var stylesheet = new Request(
			"get",
			"/static/bower_components/bootstrap/dist/css/bootstrap.min.css"
		);

		return Bluebird.join(
			javascript.inject(Scavenger),
			stylesheet.inject(Scavenger),
			function (javascript, stylesheet) {
				expect(javascript.statusCode, "javascript").to.equal(200);
				expect(stylesheet.statusCode, "stylesheet").to.equal(200);
			}
		);
	});

	it("include jquery", function () {
		var jquery = new Request(
			"get",
			"/static/bower_components/jquery/dist/jquery.min.js"
		);

		return jquery.inject(Scavenger)
		.then(function (response) {
			expect(response.statusCode, "jquery").to.equal(200);
		});
	});

	it("include the scavenger stylesheet", function () {
		var stylesheet = new Request(
			"get",
			"/static/css/scavenger.css"
		);

		return stylesheet.inject(Scavenger)
		.then(function (response) {
			expect(response.statusCode, "stylesheet").to.equal(200);
		});
	});
});
