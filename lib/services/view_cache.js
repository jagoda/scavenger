"use strict";
var Bluebird = require("bluebird");
var Catbox  = require("catbox");

Bluebird.promisifyAll(Catbox);

function ViewCache () {
	var ttl = 24 * 60 * 60 * 1000;    // 24 hours.
	var client;

	function key (id) {
		return {
			id      : id,
			segment : "view_cache"
		};
	}

	this.get = Bluebird.method(function (id) {
		return client.getAsync(key(id))
		.then(function (result) {
			return result ? result.item : null;
		});
	});

	this.set = Bluebird.method(function (id, value) {
		return client.setAsync(key(id), value, ttl);
	});

	this.start = function () {
		var options = {
			partition : process.env.CACHE_DATABASE || "cache"
		};

		client = new Catbox.Client(require("catbox-mongodb"), options);
		return client.startAsync();
	};

	this.stop = function () {
		client.stop();
	};
}

module.exports = ViewCache;
