
var redis_url = require('redis-url');
var redistogo_url = process.env.REDISTOGO_URL || null;
redis = redis_url.connect(redistogo_url);



var match_count = -1;

var done = function(results) {

  if (results) {
    console.log("results", results)

  }

  if (--match_count <= 0)
    process.exit();
}

redis.smembers("scripts", function(err,scripts) {

  match_count = (scripts.length-1)*(scripts.length-1);

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
                // results = Mars.runBattle([iScript, jScript], NUM_ROUNDS);
              }
              done(results);

            })
          });

        });

    }
  }

})


