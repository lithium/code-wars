
app.get('/', 
  function(req, res) {
    var done = function(user) {
      res.render('index.html', { 
        'user': user
      });
    }

    if (req.user) {

      redis.get("username:"+req.user.username, function(err,user) {
        done(user);
      });


    } else {

      done(null);

    }


  });


