"use strict";
var Bluebird      = require("bluebird");
var Catbox        = require("catbox");
var Configuration = require("./configuration");
var URL           = require("url");

Bluebird.promisifyAll(Catbox);

function ViewCache () {
	var configuration = new Configuration();
	var ttl           = 24 * 60 * 60 * 1000;    // 24 hours.
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

	this.stop = function () {
		client.stop();
	};
}

module.exports = ViewCache;
