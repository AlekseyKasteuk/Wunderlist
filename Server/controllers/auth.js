var passport = require('../authorization/authorization-strategy');
var User = require('../models/user');

module.exports.login = function (req, res, next) {
  passport.authenticate('local', function (err, user, info) {
    if (err) { 
      return next(err); 
    }
    if (!user) { 
      return res.send(404); 
    }
    req.logIn(user, function(err) {
      if (err) { 
        return res.send(400); 
      }
      return res.send(200);
    });
  })(req, res, next);
}

module.exports.register = function(req, res, next) {
  var user = new User({name: req.body.name, email: req.body.email, password: req.body.password});
  user.save(function (err) {
    err
      ? res.send(400)
      : res.send(200);
  });
};

module.exports.getUser = function (req, res) {
  User.findOne({email: req.query.username, password: req.query.password}, function (err, user) {
    if(err || !user) {
      res.send(401);
      return;
    }
    else {
      res.send(user);
    }
  });
}

module.exports.changeProfile = function (req, res) {
  if(req.body.password !== req.body.repeatPassword) {
    res.send(400);
    return;
  }
  User.update({_id: req.params.id}, {name: req.body.name, password: req.body.password}, function (err) {
    if(err) {
      return res.send(400);
    }
    res.send(200);
  })
}