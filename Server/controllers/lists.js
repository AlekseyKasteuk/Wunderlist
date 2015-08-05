var List = require('../models/list');
var User = require('../models/user');
var Task = require('../models/task')
var io = require('../../app');

module.exports.getTasks = function (req, res, next) {
  User.findOne({email: req.query.username, password: req.query.password}, function (err, user) {
    if(err || !user) {
      res.send(401);
      return;
    }
    else {
      List.findOne({$and: [{_id: req.params.id}, {$or: [{users: user._id}, {owner: user._id}]}]}, function (err, list) {
        if(err || !list) {
          res.send(400);
          return;
        }
        Task.find({list: req.params.id}).populate('creator').exec(function (err, tasks) {
          if(err) {
            res.send(400);
          }
          var s = tasks.map(function (v) {
            var a = {id: v._id, name: v.name, done: v.done}
            return a;
          });
          res.end(JSON.stringify({list: {name: list.name, id: list._id}, data: s}));
        })
      })
    }
  });
}

module.exports.getLists = function (req, res, next) {
  User.findOne({email: req.query.username, password: req.query.password}, function (err, user) {
    if(err || !user) {
      res.send(401);
      return;
    }
    List.find({$or : [{users: user._id}, {owner: user._id}, {invites: user._id}]}).populate('owner').populate('users').populate('invites').exec(function (err, lists) {
      if(err) {
        res.send(400);
      }
      var result = {own: [], shared: [], invites: []};
      lists.forEach(function (v) {
        var r = {id: v._id, owner: {email: v.owner.email, name: v.owner.name}, name: v.name, users: {email: v.users.email, name: v.users.name}, invites: {email: v.invites.email, name: v.invites.name}};
        if(r.owner.email.toString() == req.query.username) {
          result.own.push(r);
        }
        else {
          if(v.invites.map(function (v) {
            return v._id.toString();
          }).indexOf(user._id.toString()) != -1) {
            result.invites.push(r);
          }
          else {
            result.shared.push(r);
          }
        }
      });
      res.end(JSON.stringify(result));
    });
  });
}

module.exports.newList = function (req, res, next) {
  User.findOne({email: req.body.username, password: req.body.password}, function (err, user) {
    if(err) {
      res.send(401);
      return;
    }
    if(!req.body.name) {
      res.send(400);
      return;
    }
    var t = new List({name: req.body.name, owner: user._id, users: [], invites: []});
    t.save(function (err) {
      if(err) {
        res.send(400);
      }
      List.findOne({_id: t._id}).populate('owner').populate('users').populate('invites').exec(function (err, list) {
        if(err || !list) {
          return;
        }
        io.io.emit('newlist', {id: list._id, owner: {email: list.owner.email, name: list.owner.name}, name: list.name, users: {email: list.users.email, name: list.users.name}, invites: {email: list.invites.email, name: list.invites.name}});
      });
      res.send(200);

    });
  });
}

module.exports.updateListName = function (req, res, next) {
  User.findOne({email: req.body.sender.username, password: req.body.sender.password}, function (err, user) {
    if(err || !user) {
      res.send(401);
      return;
    }
    else {
      if(!req.body.name) {
        List.findOne({_id: req.params.id}, function (err, list) {
          if(!err) {
            io.io.emit('update_list_name', {id: list._id, name: list.name});
            res.send(400);
          }
        })
        return;
      }
      List.update({_id: req.params.id}, {$set: {name: req.body.name}}, function () {
        io.io.emit('update_list_name', req.body);
        res.send(200);
      });
    }
  });
}

module.exports.invite = function (req, res, next) {
  User.findOne({email: req.body.sender.username, password: req.body.sender.password}, function (err) {
    if(err) {
      res.send(401);
      return;
    }
    else {
      User.findOne({email: req.body.user}, function (err, user) {
        if(err || !user) {
          res.send(404);
          return;
        }
        else {
          List.findOne({_id: req.body.list}).populate('owner').populate('users').populate('invites').exec(function (err, list) {
            if(err ) { return; }
            if(list.owner.email != req.body.user && list.invites.map(function (user) {
                  return user._id.toString();
                }).indexOf(user._id.toString()) === -1 && list.users.map(function (user) {
                  return user._id.toString();
                }).indexOf(user._id.toString()) === -1) {
              List.update({_id: req.body.list}, {$addToSet: {invites: user._id}}, function () {
                console.log(arguments);
              });
              io.io.emit('invite', {user: req.body.user, msg: {id: list._id, owner: {email: list.owner.email, name: list.owner.name}, name: list.name, users: list.users.map(function (user) {
                  return {email: user.email, name: user.name};
                }), invites: list.invites.map(function (user) {
                  return {email: user.email, name: user.name};
                })}});
              res.send(200);
            }
            else {
              res.send(400);
            }
          });
        }
      })
    }
  });
}

module.exports.acceptInvite = function (req, res, next) {
  User.findOne({email: req.body.username, password: req.body.password}, function (err, user) {
    if(err || !user) {
      res.send(401);
      return;
      return;
    }
    List.findOne({_id: req.params.id, invites: user._id}).populate('owner').populate('users').populate('invites').exec(function (err, list) {
      if(err || !list) {
        res.send(404);
      }
      else {
        if(list.users.indexOf(user._id) == -1) {
          List.update({_id: list._id}, {$addToSet: {users: user._id}}, function () {
            List.update({_id: list._id}, {$pull: {invites: user._id}}, function () {
              io.io.emit('movetoshared', {user: req.body.username, msg: {id: list._id, owner: {email: list.owner.email, name: list.owner.name}, name: list.name, users: list.users.map(function (user) {
                  return {email: user.email, name: user.name};
                }), invites: list.invites.map(function (user) {
                  return {email: user.email, name: user.name};
                })}});
            });
          });
        }
        res.send(200);
      }
    })
  });
}

module.exports.deleteList = function (req, res, next) {
  User.findOne({email: req.query.username, password: req.query.password}, function (err, user) {
    if(err) {
      res.send(401);
      return;
    }
    else {
      List.findOne({_id: req.params.id}, function (err, list) {
        if (err || !list) {
          res.send(404);
        }
        if(list.owner.toString() == user._id.toString()) {
          Task.find({list: list._id}, function (err, tasks) {
            tasks.forEach(function (task) {
              fileWork.deleteFilesOfTask(task._id.toString());
            })
            Task.remove({list: list._id}, function (err) { });
          })
          List.remove({_id: list._id}, function (err) {
            if(!err) {
              io.io.emit('deleteList', {list: list._id, user: '*'});
            }
          });
        } else {
          List.update({_id: list._id}, {$pull: {invites: user._id}}, function (err) {});
          List.update({_id: list._id}, {$pull: {users: user._id}}, function (err) { });
          io.io.emit('deleteList', {list: list._id, user: req.query.username});
        }
        res.send(200);
      })
    }
  });
}