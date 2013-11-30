
var redis_url = require('redis-url');
var redistogo_url = process.env.REDISTOGO_URL || null;
var redis = redis_url.connect(redistogo_url);
var lockfile = require('lockfile')

Backbone = require('backbone')
_ = require('underscore')
RedAsm = require('./public/js/src/redasm')
Mars = require('./public/js/src/mars')

var core = new Mars.MarsCore({
  'maxCycles': 50000,
})


var LOCKFILE_PATH = "/tmp/hill.championship.lock"
var NUM_ROUNDS = 100;
var match_count = 0;

var already_run = {}



var exit = function() {
     lockfile.unlock(LOCKFILE_PATH, function(err) {
      if (err)
        console.log("Failed to unlock!", LOCKFILE_PATH);
      process.exit();
    })
 
}

var done = function(results, elapsedTime) {

  if (results) {
    var scores = {}

    for (var r=0; r < results.length; r++) {
      // console.log("round #", r+1);

      for (var i=0; i < results[r].players.length; i++) {
        var player = results[r].players[i];
        // console.log("  ",player.username, player.score );

        if (!(player.username in scores)) {
          scores[player.username] = {
            'wins': 0,
            'losses': 0,
            'ties': 0,
            'score': 0,
          };
        }
        scores[player.username].score += player.score;
        if (player.score == 2) {
          scores[player.username].wins++
        }
        else if (player.score == 1) {
          scores[player.username].ties++
        }
        else if (player.score == 0) {
          scores[player.username].losses++
        }
      }
    }

    if (elapsedTime)
      console.log("  Duration: "+elapsedTime/1000+"s")
    console.log(scores);
    console.log("\n")
  }


  if (--match_count <= 0) {
    exit();
  }

}



var main = function() {

  redis.smembers("queuedScripts", function(err,queuedScripts) {
    if (queuedScripts.length == 0) {
      console.log("no queued scripts.");
      done()
    }

    redis.smembers("scripts", function(err,scripts) {

      match_count = (queuedScripts.length)*(scripts.length-1);

      console.log("queued", queuedScripts)
      console.log(match_count+" matches, "+NUM_ROUNDS+" rounds each.")

      var i,j;
      for (i = 0; i < queuedScripts.length; i++) {
        for (j = 0; j < scripts.length; j++) {

            /* this inner loop needs to be in a closure for proper scoping */
            (function() {


              var iKey = queuedScripts[i];
              var jKey = scripts[j];

              if (iKey == jKey) 
                return;

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

                    if (already_run[match_key]) {
                      done();
                      return;
                    }

                    console.log(iKey+" vs. "+jKey);
                    var startTime = Date.now();

                    if (iScript && jScript) {
                      results = core.runBattle([JSON.parse(iScript), JSON.parse(jScript)], NUM_ROUNDS);
                    }
                    var endTime = Date.now();
                    already_run[match_key] = true

                    done(results, endTime - startTime);

                  })
                });

              });

            })();

        }
      }
      done();

    })

  })

}

lockfile.lock(LOCKFILE_PATH, function(err) {
  if (err) {
    console.log("Failed to lock!", LOCKFILE_PATH);
    process.exit();
  }

  main();

})