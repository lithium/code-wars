var passport = require("passport");

ensureAuthenticated = function(req, res, next) {
  if (req.isAuthenticated()) { return next(); }
  res.redirect('/')
}


app.get('/github-login', 
  passport.authenticate('github'));

app.get('/github-callback', 
  passport.authenticate('github', {failureRedirect: '/'}),
  function(req, res) {

    var user = {
      'username': req.user.username,
      'avatar': req.user._json.avatar_url,
    };
    redis.set('user:'+user.username, JSON.stringify(user));

    //success
    res.redirect('/');
  });

app.get('/logout', 
  function(req, res) {
    req.logout();
    res.redirect('/');
  });