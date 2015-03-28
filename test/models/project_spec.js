"use strict";
var Project = require("../../lib/models/project");

var expect = require("chai").expect;
var _      = require("lodash");

describe("A project", function () {
	var options = {
		description : "A super cool project.",
		forks       : 10,
		language    : "javascript",
		name        : "sandwiches",
		owner       : "octocat",
		stargazers  : 500,
		watchers    : 42
	};

	var project;

	before(function () {
		project = new Project(options);
	});

	it("has a schema", function () {
		var project;

		expect(function () {
			project = new Project({ foo : "bar" });
		}).to.throw();
	});

	it("has enumerable attributes", function () {
		expect(_.assign({}, project)).to.deep.equal(options);
	});

	it("does not enumerate methods", function () {
		expect(_.functions(project)).to.have.length(0);
	});

	describe("without a description", function () {
		var newOptions = _.omit(options, "description");

		var project;

		before(function () {
			project = new Project(newOptions);
		});

		it("has an empty description string", function () {
			expect(project).to.have.property("description", "");
		});
	});

	describe("without a language", function () {
		var newOptions = _.omit(options, "language");

		var project;

		before(function () {
			project = new Project(newOptions);
		});

		it("has 'unknown' for the language value", function () {
			expect(project).to.have.property("language", "unknown");
		});
	});
});
