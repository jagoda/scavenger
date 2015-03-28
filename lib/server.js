"use strict";
var Bluebird = require("bluebird");
var Hapi     = require("hapi");

var server = module.exports = new Hapi.Server();

Bluebird.promisifyAll(Hapi);

server.connection();
server.registerAsync([
	{
		register : require("good"),

		options : {
			reporters : [
				{
					reporter : require("good-console"),

					args : [
						{
							error    : "*",
							log      : "*",
							response : "*"
						}
					]
				}
			]
		}
	},
	{
		register : require("./plugins/web")
	}
])
.then(function () {
	return server.startAsync();
})
.then(function () {
	server.log([ "info", "server" ], "The server is listening at '" + server.info.uri + "'.");
});
