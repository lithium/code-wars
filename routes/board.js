app.get('/board/championship', 
  function(req, res) {
    var board = []


    var doneCounter = 0;
    var done = function() {
      if (--doneCounter <= 0) {
        board = _.sortBy(board, 'score').reverse()
        res.send(board)
      }
    }

    redis.hgetall('board:championship', function(err,redisBoard) {
      for (var key in redisBoard) {
        (function() {
          var username = key;

          var boardEntry = JSON.parse(redisBoard[key]) 
          doneCounter++;

          redis.get('user:'+username, function(err, userStr) {
            if (userStr) {
              var user = JSON.parse(userStr)
              boardEntry.avatar = user.avatar;
            }

            redis.get('script:'+username, function(err, scriptStr) {
              if (scriptStr) {
                boardEntry.script = JSON.parse(scriptStr);
              }
              board.push(boardEntry)
              done();
            });

          });

        })();

      }


    })

  });

