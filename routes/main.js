
app.get('/', function(req, res) {
  res.render('index.html', { 
    user: {
      'username': req.user.username,
      'avatar': req.user.avatar
    }
  });
});


