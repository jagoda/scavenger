"use strict";
var Bluebird   = require("bluebird");
var Cache      = require("../services/cache");
var GitHub     = require("../services/github");
var Handlebars = require("handlebars");
var Path       = require("path");
var Util       = require("util");

var _ = require("lodash");

exports.register = function (server, options, next) {
	var cache  = new Cache();
	var github = new GitHub(cache);
	var site   = "Scavenger";

	if (!process.env.GITHUB_TOKEN) {
		server.log(
			[ "warn", "github" ],
			[
				"GITHUB_TOKEN is not defined. Unauthenticated API requests are subject to lower",
				"rate limits."
			].join(" ")
		);
	}

	cache.start().nodeify(next);
	server.on("stop", function () {
		cache.stop();
	});

	server.views({
		context : {
			brand : site,
			title : site
		},

		engines : {
			html : Handlebars
		},

		helpersPath  : "helpers",
		partialsPath : "partials",
		relativeTo   : Path.join(__dirname, "..", "views")
	});

	server.ext("onPreResponse", function (request, reply) {
		if (!request.response.isBoom) {
			reply.continue();
			return;
		}

		var error = request.response;
		var message;

		switch (error.output.statusCode) {
			case 404: {
				message = "Oh noes! We couldn't find what you were looking for.";
				break;
			}
			default: {
				message = "Oh snap! Something flew off the rails. Please try again later.";
				server.log(
					[ "error", "web" ],
					Util.format("message: %s stack: %s", error.message, error.stack)
				);
				break;
			}
		}

		reply
		.view(
			"error.html",
			{
				title   : error.output.payload.error + " - " + site,
				error   : error.output.payload.error,
				message : message
			}
		)
		.code(error.output.statusCode);
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
		path   : "/{owner}/{name}",

		handler : function (request, reply) {
			var name  = request.params.name;
			var owner = request.params.owner;

			github.project(owner, name)
			.then(function (project) {
				var properties = {
					contributors_count : github.contributorCount(project)
				};

				return [ project, Bluebird.props(properties) ];
			})
			.spread(function (project, properties) {
				project = _.assign(project, properties);

				reply.view(
					"project.html",
					{
						project : project,
						title   : name + " - " + site
					}
				);
			})
			.catch(reply);
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
};

exports.register.attributes = {
	name : "web"
};
