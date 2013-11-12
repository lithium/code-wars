/*
 * Code Wars Referee
 *  node.js, express, redis
 *
 */

// imports
var express = require('express')
var redis_url = require('redis-url');
var GitHubApi = require("github");
var _ = require("underscore");
var engines = require("consolidate");

// heroku environment default to local development
var port = process.env.PORT || 5000;
var redistogo_url = process.env.REDISTOGO_URL || null;

// local settings
require('./local_settings')


// global application objects
redis = redis_url.connect(redistogo_url);
github = new GitHubApi({version: "3.0.0"});
app = express();


//register underscore templates
app.configure(function() {
  app.use(express.static(__dirname+'/public'));
  app.engine('html', engines.underscore);
})

// import routes
require('./routes');



// main loop
app.listen(port, function() {
  console.log("Listening on " + port);
});