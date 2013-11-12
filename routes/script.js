
var RedAsm = require('../public/src/js/redasm.js')
var crypto = require('crypto')


app.post('/script', 
  function(req, res) {
    var name = req.body.name;
    var source = req.body.source;

    if (!(name && source)) {
      res.send("Invalid arguments. 'name' and 'source' required.")
      return;
    }

    // if (!(req.user && req.user.username)) {
    //   res.send("Must authenticate via github first.")
    //   return;
    // }

    var result = RedAsm.compile(source)
    var hash = crypto.createHash('sha1')
    hash.update(new Buffer(result.compiledBytes));
    var sha1 = hash.digest('hex');

    var script_key = "script:"+sha1;
    console.log("script_key", script_key)
    redis.get(script_key, function(err,existing) {
      if (existing) {
        res.send({
          success: false,
          error: "Script already exists!",
          'existing': existing
        });
        return;
      }

      var script = {
        // 'username': req.user.username,
        'sha1': sha1,
        'scriptName': name,
        'source': source,
        'compiledBytes': result.compiledBytes,
      };

      redis.set(script_key, script);
      res.send({
        success: true,
        'script': script
      });


    });

  });
