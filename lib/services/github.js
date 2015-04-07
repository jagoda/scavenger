"use strict";
var Bluebird = require("bluebird");
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
	function consumePages (url, items) {
		items = items || [];

		return request(url)
		.spread(function (response, body) {
			var result;

			switch (response.statusCode) {
				case 200 : {
					var links = parseLinkHeader(response.headers.link);
					items = items.concat(body);

					if (links && links.next) {
						result = consumePages(links.next.url, items);
					}
					else {
						result = items;
					}
					break;
				}
				default : {
					serverError(response, body);
				}
			}
			return result;
		})
		.catch(function (error) {
			Boom.wrap(error, null, error.message);
		});
	}

	function headers () {
		var requestHeaders = {};

		if (process.env.GITHUB_TOKEN) {
			requestHeaders.authorization = "Basic " + new Buffer(process.env.GITHUB_TOKEN +
				":x-oauth-basic").toString("base64");
		}

		return requestHeaders;
	}

	function request (path) {
		return cache.get(path, headers());
	}

	this.contributorCount = function (project) {
		var contributorUrl = url(
			"repos", project.owner.login, project.name, "contributors"
		);
		var count = 0;

		return request(contributorUrl)
		.spread(function (response, body) {
			switch (response.statusCode) {
				case 200: {
					var links = parseLinkHeader(response.headers.link);

					if (links) {
						count += body.length * (links.last.page - 1);
						return request(links.last.url)
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
					}
					else {
						count += body.length;
					}
					break;
				}
				default: {
					serverError(response, body);
				}
			}
		})
		.then(function () {
			return count;
		});
	};

	this.findProjects = function (query) {
		var searchUrl = url("search", "repositories?q=" + encodeURIComponent(query));
		return request(searchUrl)
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
			throw Boom.wrap(error, null, error.message);
		});
	};

	this.participation = function (project) {
		var historyUrl = url(
			"repos", project.owner.login, project.name, "commits"
		);

		return consumePages(historyUrl)
		.then(function (commits) {
			return Bluebird.all(
				commits.map(function (commit) {
					if (!commit.author) {
						return true;
					}

					if (commit.author.login === project.owner.login) {
						return false;
					}

					var membershipUrl = url(
						"orgs", project.owner.login, "members", commit.author.login
					);

					return request(membershipUrl)
					.spread(function (response) {
						return 204 !== response.statusCode;
					});
				})
			)
			.then(function (tallies) {
				var external = tallies.reduce(
					function (previous, result) {
						return previous + (result ? 1 : 0);
					},
					0
				);

				return 0 === tallies.length ? 0 : external / tallies.length;
			});
		})
		.catch(function (error) {
			throw Boom.wrap(error, null, error.message);
		});
	};

	this.project = function (owner, name) {
		return request(url("repos", owner, name), headers())
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
			throw Boom.wrap(error, null, error.message);
		});
	};
}

module.exports = GitHub;
