var express = require('express');
var routes = require('./routes');

var app = express();

app.set('view engine', 'ejs');

//On slide 51. When should we use these?
app.locals.pagetitle = "Thomas Dvornik";

app.get('/', routes.index);
app.get('/about', routes.about);
app.get('/projects', routes.projects);

app.get('*', function(req, res) {
  res.send('Bad Route');
});

var server = app.listen(3000, function() {
  console.log('Listening on port 3000');
});
