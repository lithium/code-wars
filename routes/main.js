
app.get('/', function(req, res) {
  res.render('index.html', { 
    user: req.user,
  });
});


