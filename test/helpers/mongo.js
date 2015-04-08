"use strict";
var Bluebird      = require("bluebird");
var Configuration = require("../../lib/services/configuration");
var MongoDB       = require("mongodb");
var MongoHelper   = module.exports;

MongoHelper.dropDatabase = function () {
	var configuration = new Configuration();

	return MongoDB.connectAsync(configuration.cache.database())
	.then(function (db) {
		return db.dropDatabaseAsync().return(db);
	})
	.then(function (db) {
		return db.closeAsync();
	});
};
