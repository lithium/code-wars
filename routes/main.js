
app.get('/', function(req, res) {
  var user = null
  if (req.user) {
    user = {
      'username': req.user.username,
      'avatar': req.user._json.avatar_url
    }
  }
  res.render('index.html', { 
    'user': user
  });
});


