"use strict";
var GitHub     = require("../services/github");
var Handlebars = require("handlebars");
var Path       = require("path");

exports.register = function (server, options, next) {
	var github = new GitHub();
	var site   = "Scavenger";

	server.views({
		context : {
			brand : site,
			title : site
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
			var query = request.query.q;

			if (query) {
				github.findProjects(query)
				.then(function (results) {
					reply.view(
						"search.html",
						{
							projects : results,
							query    : query,
							title    : query + " - " + site
						}
					);
				})
				.catch(reply);
				return;
			}
			else {
				reply.view("welcome.html");
				return;
			}
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
