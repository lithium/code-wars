
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


var scoresFromResults = function(results) {
  var scores = {}

  for (var r=0; r < results.length; r++) {
    var roundResult = results[r];
    for (var i=0; i < roundResult.players.length; i++) {
      var player = roundResult.players[i];

      if (!(player.username in scores)) {
        scores[player.username] = {
          'score': 0,
          'wins': 0,
          'losses': 0,
          'ties': 0,
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

  return scores;

}

var done = function() {

  if (--match_count <= 0) {
    exit();
  }

}



var rescoreHill = function(challengerName, opponentName, scores, elapsedTime) {

  challengerEntry = {
    'script': challengerName,
    'score': {'wins':0,'losses':0,'ties':0,'total':0},
    'record': {}
  }


  redis.hget("board:championship", opponentName, function(err,opponentStr) {
    var opponentEntry = {
      'script': opponentName,
      'score': {'wins':0,'losses':0,'ties':0,'total':0},
      'record': {}
    }
    if (opponentStr) {
      var opponentEntry = JSON.parse(opponentStr);
      var oldRecord = opponentEntry.record[challengerName];

      // this is a rematch, so undo old scores from opponent's history.
      if (oldRecord) {
        opponentEntry.score.wins -= oldRecord.score.losses
        opponentEntry.score.losses -= oldRecord.score.wins
        opponentEntry.score.ties -= oldRecord.score.ties
      }
    }

    opponentEntry.record[challengerName] = scores
    challengerEntry.record[opponentName] = scores

    console.log()
    // aggregate_score(challengerEntry);
    // aggregate_score(opponentEntry);

    // done(results, elapsedTime);
    done();

  });

}

var main = function() {

  redis.smembers("queuedScripts", function(err,queuedScripts) {
    if (queuedScripts.length == 0) {
      console.log("no queued scripts.");
      done()
    }

    redis.smembers("scripts", function(err,scripts) {

      match_count = (queuedScripts.length)*(scripts.length-1);


      console.log(queuedScripts.length+" queued:", queuedScripts)
      console.log(scripts.length+" warriors on the hill:", match_count+" matches, "+NUM_ROUNDS+" rounds each.")
      if (match_count < 1) {
        done();
        return
      }

      var i,j;
      for (i = 0; i < queuedScripts.length; i++) {
        for (j = 0; j < scripts.length; j++) {

            /* this inner loop needs to be in a closure for proper scoping */
            (function() {


              var iKey = queuedScripts[i];
              var jKey = scripts[j];

              if (iKey == jKey)  // dont play against yourself
                return;


              //alphabetize the match key for deduping
              if (jKey < iKey) {
                var tmp = jKey;
                jKey = iKey;
                iKey = tmp;
              }
              var match_key = "match:"+iKey+":"+jKey;

              // dont run this match if we already ran it during this hill run
              if (already_run[match_key]) {
                done();
                return;
              }
              already_run[match_key] = true

              // get the two scripts and battle them  
              redis.get(iKey, function(err,iScript){
                redis.get(jKey, function(err,jScript){
                  var results;

                  if (iScript && jScript) {
                    console.log(iKey+" vs. "+jKey);

                    var startTime = Date.now();
                    results = core.runBattle([JSON.parse(iScript), JSON.parse(jScript)], NUM_ROUNDS);
                    var elapsedTime = Date.now() - startTime;

                    var scores = scoresFromResults(results);
                    rescoreHill(queuedScripts[i], scripts[i], scores, elapsedTime);
                  } else {
                    done();
                  }

                });
              });


            })(); 
            /* end of inner loop closure */

        }
      }

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