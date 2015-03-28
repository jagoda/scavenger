"use strict";
var Bluebird = require("bluebird");
var Boom     = require("boom");
var Project  = require("../models/project");
var URL      = require("url");
var Util     = require("util");

var request = Bluebird.promisify(require("request"));

function makeRequest (url) {
	return request({
		headers : {
			"user-agent" : "request"
		},

		method : "get",
		json   : true,
		url    : url
	});
}

function marshallProject (description) {
	return new Project({
		description : description.description,
		forks       : description.forks_count,
		language    : description.language,
		name        : description.name,
		owner       : description.owner.login,
		stargazers  : description.stargazers_count,
		watchers    : description.watchers_count
	});
}

function serverError (response, payload) {
	throw Boom.badImplementation(
		Util.format("Unexpected server error (%d). Message was:\n%j", response.statusCode, payload)
	);
}

function url () {
	var path = Array.prototype.slice.call(arguments);

	path.unshift("");
	return URL.resolve("https://api.github.com", path.join("/"));
}

function GitHub () {
	this.findProjects = function (query) {
		var searchUrl = url("search", "repositories?q=" + encodeURIComponent(query));
		return makeRequest(searchUrl)
		.spread(function (response, body) {
			switch (response.statusCode) {
				case 200: {
					return body.items.map(function (item) {
						return marshallProject(item);
					});
				}
				default: {
					serverError(response, body);
				}
			}
		})
		.catch(function (error) {
			throw Boom.wrap(error);
		});
	};

	this.project = function (owner, name) {
		return makeRequest(url("repos", owner, name))
		.spread(function (response, body) {
			switch (response.statusCode) {
				case 200: {
					return marshallProject(body);
				}
				case 404: {
					throw Boom.notFound(Util.format("Project '%s/%s' not found.", owner, name));
				}
				default: {
					serverError(response, body);
				}
			}
		})
		.catch(function (error) {
			throw Boom.wrap(error);
		});
	};
}

module.exports = GitHub;
