
app.get('/', function(req, res) {
  var user = null
  if (req.user) {
    user = {
      'username': req.user.username,
      'avatar': req.user.avatar
    }
  }
  res.render('index.html', { 
    'user': user
  });
});


