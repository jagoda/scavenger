"use strict";
var Boom     = require("boom");
var URL      = require("url");
var Util     = require("util");

var parseLinkHeader = require("parse-link-header");

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

	this.contributorCount = function (project) {
		var contributorUrl = url(
			"repos", project.owner.login, project.name, "contributors"
		);
		var count = 0;

		return cache.get(contributorUrl)
		.spread(function (response, body) {
			switch (response.statusCode) {
				case 200: {
					var links = parseLinkHeader(response.headers.link);
					count += body.length * (links.last.page - 1);
					return cache.get(links.last.url);
				}
				default: {
					serverError(response, body);
				}
			}
		})
		.spread(function (response, body) {
			switch (response.statusCode) {
				case 200: {
					count += body.length;
					return count;
				}
				default: {
					serverError(response, body);
				}
			}
		});
	};

	this.findProjects = function (query) {
		var searchUrl = url("search", "repositories?q=" + encodeURIComponent(query));
		return cache.get(searchUrl)
		.spread(function (response, body) {
			switch (response.statusCode) {
				case 200: {
					return body.items;
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
					return body;
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
