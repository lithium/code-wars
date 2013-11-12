var request = require('request');

app.get('/', function(req, res) {
  // res.send("Hello user.  Want to play a game?");
  res.render('index.html', { page_title: 'hello'} )
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
    var oauth = JSON.parse(body)

    request.get({
      url: 'https://api.github.com/user?access_token='+oauth.access_token,
      headers: {'Accept': 'application/json'}
    }, function(user_err,user_response,body) {
      var github_user = JSON.parse(body);
      var user = {
        'username': github_user.login,
        'avatar': github_user.avatar_url,
      };
      res.send(user);

      user.github_access_token = oauth.access_token;
      redis.set('user:'+user.username, user);

    });

  });

});