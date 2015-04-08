"use strict";
var Boom = require("boom");

var expect = require("chai").expect;

describe("The 'serviceError' matcher", function () {
	describe("matching an object that is not an Error", function () {
		it("fails", function () {
			expect(function () {
				expect({}).to.be.a.serviceError;
			}).to.throw(/Error/);
		});
	});

	describe("matching an Error that is not a Boom error", function () {
		it("fails", function () {
			expect(function () {
				expect(new Error()).to.be.a.serviceError;
			}).to.throw(/isBoom/);
		});
	});

	describe("matching an Error with a bad status code", function () {
		it("fails", function () {
			expect(function () {
				expect(Boom.wrap(new Error(), 400)).to.be.a.serviceError;
			}).to.throw(/400/);
		});
	});

	describe("matching an Error without a message", function () {
		it("fails", function () {
			expect(function () {
				var error = Boom.wrap(new Error());
				error.message = undefined;
				expect(error).to.be.a.serviceError;
			}).to.throw(/message/);
		});
	});

	describe("matching a service error", function () {
		it("succeeds", function () {
			expect(Boom.badImplementation()).to.be.a.serverError;
		});
	});
});
