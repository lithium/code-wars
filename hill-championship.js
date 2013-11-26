
var redis_url = require('redis-url');
var redistogo_url = process.env.REDISTOGO_URL || null;
var redis = redis_url.connect(redistogo_url);

Backbone = require('backbone')
_ = require('underscore')

RedAsm = require('./public/js/src/redasm')
var Mars = require('./public/js/src/mars')

var core = new Mars.MarsCore({
  'maxCycles': 80000,
})


var NUM_ROUNDS = 1;
var match_count = 0;

var done = function(results) {

  if (results) {
    for (var r=0; r < results.length; r++) {
      console.log("round #", r);

      for (var i=0; i < results[r].players.length; i++) {
        var player = results[r].players[i];
        console.log("  player #"+player.playerNumber, player.username, player.score );
      }
    }
  }

  if (--match_count <= 0)
    process.exit();
}

var already_run = {}

redis.smembers("scripts", function(err,scripts) {
  if (scripts.length == 0) {
    console.log("no scripts.");
    done()
  }

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

              if (match_key in already_run) {
                done();
              }

              if (iScript && jScript) {
                results = core.runBattle([JSON.parse(iScript), JSON.parse(jScript)], NUM_ROUNDS);
              }
              already_run[match_key] = true
              done(results);

            })
          });

        });

    }
  }

})


