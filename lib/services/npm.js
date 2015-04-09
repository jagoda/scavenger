"use strict";
var Boom = require("boom");
var Util = require("util");

var _ = require("lodash");

function Npm (cache) {
	function contents (repository, name) {
		var url = Util.format("https://api.github.com/repos/%s/%s/contents", repository, name);
		return cache.get(url)
		.spread(function (response, body) {
			if (200 === response.statusCode) {
				return body;
			}
			else {
				throw Boom.badImplementation("Failed to list repository contents.");
			}
		});
	}

	this.downloads = function (project) {
		return contents(project.owner.login, project.name)
		.then(function (contents) {
			var file = _.find(contents, { path : "package.json" });
			return cache.get(file.download_url);
		})
		.spread(function (response, manifest) {
			var url = Util.format(
				"https://api.npmjs.org/downloads/point/last-month/%s",
				manifest.name
			);
			return cache.get(url);
		})
		.catch(function (error) {
			throw new Boom.wrap(error);
		})
		.spread(function (response, data) {
			if (200 === response.statusCode) {
				return data.downloads;
			}
			else {
				throw Boom.badImplementation("Failed to get download count.");
			}
		});
	};

	this.match = function (project) {
		return contents(project.owner.login, project.name)
		.then(function (contents) {
			return _.some(contents, function (file) {
				return "package.json" === file.path;
			});
		});
	};
}

module.exports = Npm;
