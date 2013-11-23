
app.get('/', 
  function(req, res) {
    var done = function(user) {
      res.render('index.html', { 
        'user': user
      });
    }

    if (req.user) {

      redis.get("user:"+req.user.username, function(err,user) {

        redis.get("script:"+req.user.username, function(err,script) {
          var profile = JSON.parse(user);
          profile.script = JSON.parse(script);

          done(profile);

        })
      });


    } else {

      done(null);

    }


  });



