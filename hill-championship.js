
var redis_url = require('redis-url');
var redistogo_url = process.env.REDISTOGO_URL || null;
var redis = redis_url.connect(redistogo_url);

Backbone = require('backbone')
_ = require('underscore')

RedAsm = require('./public/src/js/redasm')
var Mars = require('./public/src/js/mars')

var core = new Mars.MarsCore()


var NUM_ROUNDS = 10;
var match_count = -1;

var done = function(results) {

  if (results) {
    for (var r=0; r < results.length; r++) {
      console.log("round #", r);

      for (var i=0; i < results[r].players.length; i++) {
        var player = results[r].players[i];
        console.log("  place:"+i, "player #"+player.playerNumber, player.username, player.lastCycle );
      }
    }
  }

  if (--match_count <= 0)
    process.exit();
}

redis.smembers("scripts", function(err,scripts) {

  match_count = (scripts.length)*(scripts.length-1);

  var i,j;
  for (i = 0; i < scripts.length; i++) {
    for (j = 0; j < scripts.length; j++) {
        if (i == j) 
          continue;

        var iKey = scripts[i];
        var jKey = scripts[j];

        //alphabetize 
        if (jKey < iKey) {
          var tmp = jKey;
          jKey = iKey;
          iKey = tmp;
        }

        var match_key = "match:"+iKey+":"+jKey;

        redis.get(match_key, function(err,match){
          if (match)
            done();

          redis.get(iKey, function(err,iScript){
            redis.get(jKey, function(err,jScript){
              var results;
              if (iScript && jScript) {
                results = core.runBattle([JSON.parse(iScript), JSON.parse(jScript)], NUM_ROUNDS);
              }
              // console.log("results", iScript,jScript)
              done(results);

            })
          });

        });

    }
  }

})


