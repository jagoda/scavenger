"use strict";
var Path = require("path");
var URL  = require("./url");

var expect = require("chai").expect;

describe("The URL helper", function () {
	describe("generating a file URL", function () {
		describe("for a file without a leading path delimiter", function () {
			it("does not prepend a path delimiter", function () {
				expect(URL.file("/home/testy"), "URL").to.equal("file:///home/testy");
			});
		});

		describe("for a file with a leading path delimiter", function () {
			it("prepends a path delimiter", function () {
				expect(URL.file("C:\\Documents and Settings\\Administrator"), "URL")
				.to.equal("file:///C:/Documents%20and%20Settings/Administrator");
			});
		});
	});

	describe("generating a fixture URL", function () {
		it("returns a file URL for the fixture", function () {
			var fixture = Path.join(__dirname, "fixtures", "file.html");
			expect(URL.fixture("file.html"), "URL").to.equal(URL.file(fixture));
		});
	});

	describe("generating a project URL", function () {
		it("returns a path absolute URL", function () {
			expect(URL.project("foo", "bar")).to.equal("/foo/bar");
		});
	});
});
