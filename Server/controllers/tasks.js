var User = require('../models/user');
var List = require('../models/list');
var Task = require('../models/task');
var Subtask = require('../models/subtask');

var io = require('../../app');
var fileWork = require('../models/files');

module.exports.newTask = function (req, res, next) {
  User.findOne({email: req.body.username, password: req.body.password}, function (err, user) {
    if(err) {
      res.send(401);
      return;
    }
    if(!req.body.name) {
      res.send(400);
      return;
    }
    List.findOne({_id: req.body.list}, function (err) {
      if(err) {
        res.send(404);
      }
      var t = new Task({name: req.body.name, creator: user._id, list: req.body.list});
      t.save(function (err) {
        if(err) {
          res.send(400);
          return;
        }
        // io.io.emit('addtask', {id: t._id, creator: req.body.username, name: t.name,
        //     description: t.description, date: new Date(t.date.getFullYear(), t.date.getMonth(), t.date.getDate()), list: t.list, done: t.done});
        io.io.emit('addtask', {id: t._id, creator: req.body.username, name: t.name,
            description: t.description, date: t.date, list: t.list, done: t.done});
        res.send(200);

      });
    })
  });
}

module.exports.deleteTask = function (req, res, next) {
  User.findOne({email: req.query.username, password: req.query.password}, function (err, user) {
    if(err) {
      res.send(401);
      return;
    }
    else {
      Task.remove({_id: req.params.id}, function (err) {
        if(!err) {
          io.io.emit('deleteTask', {id: req.params.id});
          fileWork.deleteFilesOfTask(req.params.id);
        }
        res.send(200);
      });
    }
  });
}

module.exports.createFile = function (req, res) {
  fileWork.create(req, res);
}

module.exports.updateTask = function (req, res) {
  User.findOne({email: req.body.sender.username, password: req.body.sender.password}, function (err, user) {
    if(err || !user) {
      res.send(401);
      return;
    }
    else {
      if(req.body.v.name !== '') {
        Task.update({_id: req.params.id}, {$set: req.body.v}, function () {
          Task.findOne({_id: req.params.id}, function (err, task) {
            if(!err) {
              var date = task.date ?  new Date(task.date.getFullYear(), task.date.getMonth(), task.date.getDate()) : undefined;
              io.io.emit('update_task', {id: task._id, creator: task.creator.username, name: task.name,
                description: task.description, date: date, done: task.done});
              res.send(200);
            }
            else {
              res.send(400);
            }
          })
        });
      }
    }
  });
}

module.exports.deleteFile = function (req, res) {
  fileWork.deleteFile(req, res);
}

module.exports.getTask = function (req, res) {
  User.findOne({email: req.query.username, password: req.query.password}, function (err, user) {
    if(err || !user) {
      res.send(401);
      return;
    }
    else {
      Task.findOne({_id: req.params.id}).populate('creator').populate('subtasks').exec(function (err, task) {
        if(err || !task) {
          res.send(404);
          return;
        }
        fileWork.read(task._id);
        var date = task.date ?  new Date(task.date.getFullYear(), 
                task.date.getMonth(), task.date.getDate()) : undefined;
        res.end(JSON.stringify({id: task._id, creator: task.creator.email, name: task.name,
            description: task.description, date: date, done: task.done, subtasks: task.subtasks}));
      })
    }
  });
}

module.exports.newSubtask = function (req, res) {
  Task.findOne({_id: req.body.task}, function (err) {
    if(err) { return res.send(404) }
      var st = new Subtask({name: req.body.name, done: false});
    st.save(function (err) {
      if(err) { return res.send(400); }
      Task.update({_id: req.body.task}, {$addToSet : { subtasks: st._id }}, function (err) {
        if(err) {return res.send(400)}
          io.io.emit('addSubtask', {task: req.body.task, subtask: st})
        res.send(200);
      })
    })
  })
}

module.exports.deleteSubtask = function (req, res) {
  Task.update({subtasks: req.params.id}, {$pull: {subtasks: req.params.id}}, function () { });
  Subtask.remove({_id: req.params.id},function (err) {
    if(!err) {
      io.io.emit('deleteSubtask', req.params.id);
    }
    res.send(200);
  })
}

module.exports.changeSubtask = function (req, res) {
  if(!req.body.name) {
    Subtask.findOne({_id: req.params.id}, function (err, subtask) {
      if(!err) {
        io.io.emit('changeSubtask', subtask);
      }
    })
    res.send(200);
    return;
  }
  Subtask.update({_id: req.params.id}, {$set: req.body}, function (err) {
    Subtask.findOne({_id: req.params.id}, function (err, subtask) {
      if(!err) {
        io.io.emit('changeSubtask', subtask);
      }
    })
    res.send(200);
  })
}