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
  res.render('default', {
    title: 'Projects',
    classname: 'about'
  });
}