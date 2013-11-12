var passport = require("passport");

app.get('/github-login', 
  passport.authenticate('github'));

app.get('/github-callback', 
  passport.authenticate('github', {failureRedirect: '/'}),
  function(req, res) {

    //success
    res.redirect('/');
  });

app.get('/logout', 
  function(req, res) {
    req.logout();
    res.redirect('/');
  });