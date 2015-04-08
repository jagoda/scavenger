"use strict";

module.exports = function (chai, utils) {
	utils.addProperty(chai.Assertion.prototype, "serviceError", function () {
		var subject = utils.flag(this, "object");
		new chai.Assertion(subject).to.be.an.instanceOf(Error);
		new chai.Assertion(subject).to.have.property("isBoom", true);
		new chai.Assertion(subject.output.statusCode).to.equal(500);
		new chai.Assertion(subject).to.have.property("message").with.length.greaterThan(0);
	});
};
