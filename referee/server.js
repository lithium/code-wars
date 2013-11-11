/*
 * Code Wars Referee
 *  node.js, express, redis
 *
 */

// imports
var express = require('express')
var redis_url = require('redis-url');
var GitHubApi = require("github");

// heroku environment default to local development
var port = process.env.PORT || 5000;
var redistogo_url = process.env.REDISTOGO_URL || null;

// local settings
require('./settings_local')


// global application objects
redis = redis_url.connect(redistogo_url);
app = express();
github = new GitHubApi({version: "3.0.0"});



// import routes
require('./routes');



// main loop
app.listen(port, function() {
  console.log("Listening on " + port);
});