exports.index = function(req, res) {
  res.render('default', {
    title: 'Thomas Dvornik',
    classname: 'home',
    users: ['Ray', 'Morten', 'James']
  });
}

exports.about = function(req, res) {
  res.render('default', {
    title: 'About Me',
    classname: 'about'
  });
}

exports.projects = function(req, res) {
  res.render('projects', {
    title: 'Projects',
    classname: 'projects',
    projects: require('./data/projects.json')
  });
}

exports.project = function(req, res) {
  var projects = require('./data/projects.json');
  var p = null;
  projects.forEach(function(project) {
    if (project.title === req.params.project) {
      p = project;
    }
  });
  res.render('project-details', p);
}
