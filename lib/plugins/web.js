"use strict";
var Bluebird   = require("bluebird");
var GitHub     = require("../services/github");
var Handlebars = require("handlebars");
var Path       = require("path");
var UrlCache   = require("../services/url_cache");
var Util       = require("util");
var ViewCache  = require("../services/view_cache");

var _ = require("lodash");

exports.register = function (server, options, next) {
	var urlCache  = new UrlCache();
	var github    = new GitHub(urlCache);
	var site      = "Scavenger";
	var viewCache = new ViewCache();

	function augmentProject (project) {
		var properties = {
			contributors_count : github.contributorCount(project),
			downloads          : github.downloads(project),
			files              : github.files(project),
			participation      : github.participation(project)
		};

		return Bluebird.props(properties)
		.then(function (properties) {
			return _.assign(project, properties);
		})
		.catch(function (error) {
			server.log(
				[ "error", "web" ],
				"Failed to build project object: " + error.message
			);
		});
	}

	if (!process.env.GITHUB_TOKEN) {
		server.log(
			[ "warn", "github" ],
			[
				"GITHUB_TOKEN is not defined. Unauthenticated API requests are subject to lower",
				"rate limits."
			].join(" ")
		);
	}

	Bluebird.join(urlCache.start(), viewCache.start()).nodeify(next);
	server.on("stop", function () {
		urlCache.stop();
		viewCache.stop();
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
		path   : "/{owner}",

		handler : function (request, reply) {
			viewCache.get(request.path)
			.then(function (view) {
				if (view) {
					reply.view("organization.html", view);
					return;
				}
				else {
					var name = request.params.owner;

					return github.organization(name)
					.then(function (projects) {
						Bluebird.all(
							projects.map(function (project) {
								return github.project(project.owner.login, project.name)
								.then(augmentProject);
							})
						)
						.then(function (projects) {
							var view = {
								name     : name,
								projects : projects,
								title    : name + " - " + site
							};

							return viewCache.set(request.path, view).return(view);
						})
						.catch(function (error) {
							server.log(
								[ "error", "web" ],
								"Failed to build organization view: " + error.message
							);
						});

						reply.view("wait.html", { title : "Please Wait" }).code(202);
					});
				}
			})
			.catch(function (error) {
				reply(error);
			});
		}
	});

	server.route({
		method : "get",
		path   : "/{owner}/{name}",

		handler : function (request, reply) {
			viewCache.get(request.path)
			.then(function (view) {
				if (view) {
					reply.view("project.html", view);
					return;
				}
				else {
					var name  = request.params.name;
					var owner = request.params.owner;

					return github.project(owner, name)
					.then(function (project) {
						reply.view("wait.html", { title : "Please Wait" }).code(202);
						augmentProject(project)
						.then(function (project) {
							var view = {
								project : project,
								title   : project.name + " - Scavenger"
							};
							return viewCache.set(request.path, view);
						})
						.catch(function (error) {
							server.log(
								[ "error", "web" ],
								"Failed to build project view: " + error.message
							);
						});
					});
				}
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
