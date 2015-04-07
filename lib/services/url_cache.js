"use strict";
var Bluebird = require("bluebird");
var Catbox   = require("catbox");

var request = Bluebird.promisify(require("request"));
var _       = require("lodash");

Bluebird.promisifyAll(Catbox);

function UrlCache () {
	var ttl = 24 * 60 * 60 * 1000;    // 24 hours
	var client;

	function enabled () {
		return !process.env.DISABLE_CACHE;
	}

	function fetch (url, headers) {
		headers = _.assign({ "user-agent" : "request" }, headers);

		return request({
			headers : headers,
			json    : true,
			method  : "get",
			url     : url
		})
		.then(function (results) {
			results = filterResults(results);
			var response = results[0];
			if (enabled() && 200 <= response.statusCode && 300 > response.statusCode) {
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
			segment : "cache"
		};
	}

	this.get = Bluebird.method(function (url, headers) {
		return client.getAsync(key(url))
		.then(function (results) {
			return results ? results.item : fetch(url, headers);
		});
	});

	this.start = function () {
		var options = {
			partition : process.env.URL_CACHE_DATABASE || "url_cache"
		};

		client = new Catbox.Client(require("catbox-mongodb"), options);
		return client.startAsync();
	};

	this.stop = Bluebird.method(function () {
		client.stop();
	});
}

module.exports = UrlCache;
