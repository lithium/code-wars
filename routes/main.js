var request = require('request');

app.get('/', function(req, res) {
  res.render('index.html', { 
    user: req.user,
  });
});


