var request = require('request');

app.get('/', function(req, res) {
  // res.send("Hello user.  Want to play a game?");
  res.render('index.html', { 
    page_title: 'hello',
    user: req.user,
  });
});


