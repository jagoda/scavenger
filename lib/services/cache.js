"use strict";
var Bluebird = require("bluebird");
var Catbox   = require("catbox");

var request = Bluebird.promisify(require("request"));

Bluebird.promisifyAll(Catbox);

function Cache () {
	var client = new Catbox.Client(require("catbox-memory"));
	var ttl    = 24 * 60 * 60 * 1000;    // 24 hours

	function enabled () {
		return !process.env.DISABLE_CACHE;
	}

	function fetch (url) {
		return request({
			headers : {
				"user-agent" : "request"
			},

			json   : true,
			method : "get",
			url    : url
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

	this.get = function (url) {
		return client.getAsync(key(url))
		.then(function (results) {
			return results ? results.item : fetch(url);
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
