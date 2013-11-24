/*
 * Code Wars Referee
 *  node.js, express, redis
 *
 */

// imports
var express = require('express')
var redis_url = require('redis-url');
var engines = require("consolidate");
var passport = require("passport");
var GitHubStrategy = require('passport-github').Strategy;

// heroku environment default to local development
var port = process.env.PORT || 5000;
var redistogo_url = process.env.REDISTOGO_URL || null;

// local settings
require('./local_settings')



// global application objects
redis = redis_url.connect(redistogo_url);
app = express();
_ = require("underscore");



//configure
passport.serializeUser(function(user, done) {
  done(null, user);
});

passport.deserializeUser(function(obj, done) {
  done(null, obj);
});

passport.use(new GitHubStrategy({
    clientID: GITHUB_CLIENT_ID,
    clientSecret: GITHUB_CLIENT_SECRET,
  },
  function(accessToken, refreshToken, profile, done) {
    process.nextTick(function() { 
      return done(null, profile);
    });
  }
));

app.configure(function() {
  app.engine('html', engines.underscore);
  app.use(express.cookieParser());
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(express.session({secret: SECRET_KEY}));
  app.use(passport.initialize());
  app.use(passport.session());
  app.use(app.router);
  app.use(express.static(__dirname+'/public'));
})


// import routes
require('./routes');



// main loop
app.listen(port, function() {
  console.log("Listening on " + port);
});
