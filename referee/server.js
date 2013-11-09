var http = require('http');
var port = process.env.PORT || 5000;

var app = http.createServer(function (req, res) {
  res.writeHead(200, {'Content-Type': 'text/plain'});
  res.end('> Hello, User.\n');
});

app.listen(port, function() {
  console.log("Listening on " + port);
});