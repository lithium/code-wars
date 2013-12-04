
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



var board = {}


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

var matchDone = function() {

  if (--match_count <= 0) {

    updateBoard(exit);
  }

}

var updateBoard = function(done) {

  redis.hgetall('board:championship', function(err, redisBoard) {
    var championshipBoard = {};
    //build existing championshipBoard from redis
    if (redisBoard) {
      for (var key in redisBoard) {
        championshipBoard[key] = JSON.parse(redisBoard[key]);
      }
    }

    // console.log("board\n", board, "\n")
    // console.log("championshipBoard\n", championshipBoard, "\n")

    //update championshipBoard with our new records
    for (var key in board) {
      var boardEntry = board[key]
      var championEntry = championshipBoard[key] || {record:{}};

      championEntry.username = key;
      for (var recordKey in boardEntry.record) {
        championEntry.record[recordKey] = boardEntry.record[recordKey];
      }
      championshipBoard[key] = championEntry;
    }
    // console.log("updatedBoard\n", championshipBoard, "\n")



    //re-build scores
    for (var key in championshipBoard) {
      var boardEntry = championshipBoard[key];
      boardEntry.score = 0;
      for (var oppo in boardEntry.record) {
        boardEntry.score += boardEntry.record[oppo].wins * 3;
        boardEntry.score += boardEntry.record[oppo].ties * 1;
        boardEntry.score += boardEntry.record[oppo].losses * 0;
      }

      //save to redis 
      redis.hset('board:championship', key, JSON.stringify(boardEntry));
    }

    // console.log("matches complete\n", championshipBoard)
    redis.del("queuedScripts", function() {
      console.log("Hill run complete.")
      done();
    });


  })

}


var rescoreHill = function(challengerName, opponentName, scores, elapsedTime) {

  var challengerName = challengerName.replace(/^script:/,'')
  var opponentName = opponentName.replace(/^script:/,'')

  var challengerEntry = board[challengerName];
  if (!challengerEntry) {
    challengerEntry = board[challengerName] = {
      'username': challengerName,
      'record': {}
    }
  }



  var opponentEntry = board[opponentName];
  if (!opponentEntry) {
    opponentEntry = board[opponentName] = {
      'username': opponentName,
      'record': {}
    };
  }
  opponentEntry.record[challengerName] = scores[opponentName]
  challengerEntry.record[opponentName] = scores[challengerName]
  matchDone();


  // redis.hget("board:championship", opponentName, function(err,opponentStr) {
    // if (opponentStr) {
      // var opponentEntry = JSON.parse(opponentStr);
      // var oldRecord = opponentEntry.record[challengerName];
      // // this is a rematch, so undo old scores from opponent's history.
      // if (oldRecord) {
      //   opponentEntry.score.wins -= oldRecord.score.losses
      //   opponentEntry.score.losses -= oldRecord.score.wins
      //   opponentEntry.score.ties -= oldRecord.score.ties
      // }
    // }


    // console.log("challenger", challengerEntry)
    // console.log("opponentEntry", opponentEntry)
    // aggregate_score(challengerEntry);
    // aggregate_score(opponentEntry);

    // done(results, elapsedTime);

  // });

}

var main = function() {

  redis.smembers("queuedScripts", function(err,queuedScripts) {
    if (queuedScripts.length == 0) {
      console.log("no queued scripts.");
      exit();
      return
    }

    redis.smembers("scripts", function(err,scripts) {

      match_count = (queuedScripts.length)*(scripts.length-1);


      console.log(queuedScripts.length+" queued:", queuedScripts)
      console.log(scripts.length+" warriors on the hill:", match_count+" matches, "+NUM_ROUNDS+" rounds each.")
      if (match_count < 1) {
        exit();
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
              var aKey = iKey;
              var bKey = jKey;
              if (bKey < aKey) {
                var tmp = bKey;
                bKey = aKey;
                aKey = tmp;
              }
              var match_key = "match:"+aKey+":"+bKey;

              // dont run this match if we already ran it during this hill run
              if (already_run[match_key]) {
                matchDone();
                return;
              }
              already_run[match_key] = true

              // get the two scripts and battle them  
              redis.get(iKey, function(err,iScript){
                redis.get(jKey, function(err,jScript){
                  var results;

                  if (iScript && jScript) {
                    console.log(iKey+" vs. "+jKey);

                    var iPlayer = JSON.parse(iScript);
                    var jPlayer = JSON.parse(jScript);
                    var iCompiled = RedAsm.compile(iPlayer.source)
                    var jCompiled = RedAsm.compile(jPlayer.source)

                    if (!(iCompiled && jCompiled && iCompiled.success && jCompiled.success)) {
                      console.log("failed to compile", iCompiled, jCompiled)
                      matchDone();
                    }

                    iPlayer.compiledBytes = iCompiled.compiledBytes
                    jPlayer.compiledBytes = jCompiled.compiledBytes

                    var startTime = Date.now();
                    results = core.runBattle([iPlayer, jPlayer], NUM_ROUNDS);
                    var elapsedTime = Date.now() - startTime;

                    var scores = scoresFromResults(results);
                    rescoreHill(iKey, jKey, scores, elapsedTime);
                  } else {
                    matchDone();
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