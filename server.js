var express = require('express');
var app = express();

app.set('view engine', 'ejs');

//On slide 51. When should we use these?
app.locals.pagetitle = "Thomas Dvornik";

app.get('/', function(req, res) {
  res.render('default', {
    title: 'Home',
    classname: 'home',
    users: ['Ray', 'Morten', 'James']
  });
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
