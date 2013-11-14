
app.get('/', 
  function(req, res) {
    var done = function(user) {
      res.render('index.html', { 
        'user': user
      });
    }

    if (req.user) {

      redis.get("username:"+req.user.username, function(err,user) {
        console.log("redis get ", req.user.username, err, user)
        done(JSON.parse(user));
      });


    } else {

      done(null);

    }


  });


