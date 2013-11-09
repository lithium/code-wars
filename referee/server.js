/*
 * Code Wars Referee
 *  node.js, express, redis
 *
 */

// imports
var express = require('express')
var redis_url = require('redis-url');


// environment from heroku
var port = process.env.PORT || 5000;
var redistogo_url = process.env.REDISTOGO_URL;



// application objects
var app = express();
var redis = redis_url.connect(redistogo_url)




// routes
app.get('/', function(req, res) {
  redis.get('foo', function(e,foo) {
    res.send({'message': "Hello, "+foo});
  });
});


app.get('/foo', function(req, res) {
  // redis.set('foo', req);
  var foo = req.connection.remoteAddress;
  redis.set("foo", foo);
  res.send(foo);
});

// main loop
app.listen(port, function() {
  console.log("Listening on " + port);
});