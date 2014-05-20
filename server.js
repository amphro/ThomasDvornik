var express = require('express');
var app = express();

app.get('/', function(req, res) {
  res.send('<H1>Hello</H1> Express');
});

app.get('/projects', function(req, res) {
  res.send('<H1>Projects</H1>');
});

app.get('/about', function(req, res) {
  res.send('<H1>About</H1>');
});

var server = app.listen(3000, function() {
  console.log('Listening on port 3000');
});
