"use strict";
var Handlebars = require("handlebars");
var Path       = require("path");

exports.register = function (server, options, next) {
	server.views({
		context : {
			site : "Scavenger"
		},

		engines : {
			html : Handlebars
		},

		partialsPath : "partials",
		relativeTo   : Path.join(__dirname, "..", "views")
	});

	server.route({
		method : "get",
		path   : "/",

		handler : function (request, reply) {
			reply.view("welcome.html");
		}
	});

	server.route({
		method : "get",
		path   : "/static/{path*}",

		handler : {
			directory : {
				index : false,
				path  : Path.join(__dirname, "..", "static")
			}
		}
	});

	next();
};

exports.register.attributes = {
	name : "web"
};
