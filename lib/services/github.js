"use strict";
var Boom     = require("boom");
var Project  = require("../models/project");
var URL      = require("url");
var Util     = require("util");

function marshallProject (description) {
	return new Project({
		description : description.description,
		forks       : description.forks_count,
		language    : description.language,
		name        : description.name,
		owner       : description.owner.login,
		stargazers  : description.stargazers_count,
		watchers    : description.subscribers_count
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

function GitHub (cache) {
	function headers () {
		var requestHeaders = {};

		if (process.env.GITHUB_TOKEN) {
			requestHeaders.authorization = "Basic " + new Buffer(process.env.GITHUB_TOKEN +
				":x-oauth-basic").toString("base64");
		}

		return requestHeaders;
	}

	this.findProjects = function (query) {
		var searchUrl = url("search", "repositories?q=" + encodeURIComponent(query));
		return cache.get(searchUrl)
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
		return cache.get(url("repos", owner, name), headers())
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
