var express = require('express');
var routes = require('./routes');

var app = express();

app.set('view engine', 'ejs');

app.locals.social = require("./data/social.json");

app.use(express.static('public'));

app.get('/', routes.index);
app.get('/about', routes.about);
app.get('/projects', routes.projects);
app.get('/project/:project', routes.project);
app.get('/project/', function(req, res) {
  res.redirect("/projects");
});

app.get('*', function(req, res) {
  res.send('Bad Route');
});

var server = app.listen(3000, function() {
  console.log('Listening on port 3000');
});
