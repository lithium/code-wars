
var RedAsm = require('../public/src/js/redasm.js')
var crypto = require('crypto')

require('../local_settings')


app.post('/script', 
  function(req, res) {
    var name = req.body.name;
    var source = req.body.source;

    if (!source) {
      res.send("Argument Error: Argument 'source' required.")
      return;
    }

    var username;
    if (DEBUG_AUTH) {
      username = name || 'system';
    } else if (req.user && req.user.username) {
      username = req.user.username;
    } else {
      res.send("Must authenticate via github first.");
      return;
    }  

    var result = RedAsm.compile(source)
    var hash = crypto.createHash('sha1')
    hash.update(new Buffer(result.compiledBytes));
    var sha1 = hash.digest('hex');

    redis.get("script:"+sha1, function(err,existing) {
      if (existing) {
        res.send({
          success: false,
          error: "Script is a duplicate!",
          'existing': JSON.parse(existing),
        });
        return;
      }

      var script = {
        'username': username,
        'sha1': sha1,
        'scriptName': name,
        'source': source,
        'compiledBytes': result.compiledBytes,
      };
      var json = JSON.stringify(script);

      redis.set("script:"+username, json);
      redis.set("script:"+sha1, json);
      redis.sadd("scripts", "script:"+username);


      res.send({
        success: true,
        'script': script
      });


    });

  });
