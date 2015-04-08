"use strict";
var Bluebird      = require("bluebird");
var Catbox        = require("catbox");
var Configuration = require("./configuration");
var URL           = require("url");

var request = Bluebird.promisify(require("request"));
var _       = require("lodash");

Bluebird.promisifyAll(Catbox);

function UrlCache () {
	var configuration = new Configuration();
	var ttl           = 24 * 60 * 60 * 1000;    // 24 hours
	var client;

	function fetch (url, headers) {
		headers = _.assign(
			{
				accept       : "application/vnd.github.drax-preview+json",
				"user-agent" : "request"
			},
			headers
		);

		return request({
			headers : headers,
			json    : true,
			method  : "get",
			url     : url
		})
		.then(function (results) {
			results = filterResults(results);
			var response = results[0];
			if (
				configuration.cache.enabled() &&
				200 <= response.statusCode &&
				300 > response.statusCode
			) {
				return client.setAsync(key(url), results, ttl).return(results);
			}
			return results;
		});
	}

	function filterResults (results) {
		return [
			_.pick(results[0], "headers", "statusCode"),
			results[1]
		];
	}

	function key (url) {
		return {
			id      : url,
			segment : "url_cache"
		};
	}

	this.get = Bluebird.method(function (url, headers) {
		return client.getAsync(key(url))
		.then(function (results) {
			return results ? results.item : fetch(url, headers);
		});
	});

	this.start = function () {
		var url         = URL.parse(configuration.cache.database());
		var credentials = url.auth ? url.auth.split(":") : [ null, null ];

		var options = {
			host      : url.hostname,
			password  : credentials[1],
			port      : url.port,
			username  : credentials[0],
			partition : url.pathname.substring(1)
		};

		client = new Catbox.Client(require("catbox-mongodb"), options);
		return client.startAsync();
	};

	this.stop = Bluebird.method(function () {
		client.stop();
	});
}

module.exports = UrlCache;
