var request = require('request');

app.get('/', function(req, res) {
  res.send("Hello user.  Want to play a game?");
});



app.get('/github-login', function(req, res) {
  res.redirect('https://github.com/login/oauth/authorize?client_id='+GITHUB_CLIENT_ID)
});

app.get('/github-callback', function(req, res) {

  var code = req.query.code;

  request.post({
    url: 'https://github.com/login/oauth/access_token', 
    headers: {'Accept': 'application/json'},
    form: {
      'client_id': GITHUB_CLIENT_ID,
      'client_secret': GITHUB_CLIENT_SECRET,
      'code': code
    }
  }, function(err,response,body) {
    console.log("oauth response", err, body)

    request.get({
      url: 'https://github.com/user', 
      headers: {'Accept': 'application/json'}
    }, function(user_err,user_response,github_user) {

      var user = {
        'username': github_user.login,
        'avatar': github_user.avatar_url,
        'github_access_token': body.access_token,
      };

      redis.set('user:'+user.username, user);
      res.send(user);

    });

  });

});
