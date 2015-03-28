"use strict";
var Joi = require("joi");

var _ = require("lodash");

var schema = Joi.object().keys({
	description : Joi.string().allow("").required(),
	forks       : Joi.number().integer().required(),
	language    : Joi.string().required(),
	name        : Joi.string().required(),
	owner       : Joi.string().required(),
	stargazers  : Joi.number().integer().required(),
	watchers    : Joi.number().integer().required()
})
.required();

function Project (options) {
	options             = _.clone(options);
	options.description = options.description || "";
	options.language    = options.language    || "unknown";

	Joi.assert(options, schema);
	_.assign(this, options);
}

module.exports = Project;
