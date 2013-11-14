
app.get('/', 
  function(req, res) {
    var done = function(user) {
      res.render('index.html', { 
        'user': user
      });
    }

    if (req.user) {

      redis.get("user:"+req.user.username, function(err,user) {
        done(JSON.parse(user));
      });


    } else {

      done(null);

    }


  });


