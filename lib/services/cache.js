"use strict";
var Bluebird = require("bluebird");
var Catbox   = require("catbox");

var request = Bluebird.promisify(require("request"));
var _       = require("lodash");

Bluebird.promisifyAll(Catbox);

function Cache () {
	var client = new Catbox.Client(require("catbox-memory"));
	var ttl    = 24 * 60 * 60 * 1000;    // 24 hours

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
			var response = results[0];
			if (enabled() && 200 <= response.statusCode && 300 > response.statusCode) {
				return client.setAsync(key(url), results, ttl).return(results);
			}
			return results;
		});
	}

	function key (url) {
		return {
			id      : url,
			segment : "cache"
		};
	}

	this.get = function (url, headers) {
		return client.getAsync(key(url))
		.then(function (results) {
			return results ? results.item : fetch(url, headers);
		});
	};

	this.start = function () {
		return client.startAsync();
	};

	this.stop = function () {
		client.stop();
	};
}

module.exports = Cache;
