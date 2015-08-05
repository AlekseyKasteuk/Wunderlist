var mongoose = require('mongoose');
var express = require('express');
var passport = require('./Server/authorization/authorization-strategy');
var passportLocalStrategy = require('passport-local').Strategy;
var User = require('./Server/models/user');
var authCtrl = require('./Server/controllers/auth');
var listsCtrl = require('./Server/controllers/lists');
var tasksCtrl = require('./Server/controllers/tasks');
var app = express();
var busboyBodyParser = require('busboy-body-parser');
var server = app.listen(8866);
var config = require('./Server/config/config')

app.use('/', express.static('./Client/'));
app.use('/node_modules', express.static('./node_modules/'));
app.use('/socket.io', express.static('./socket.io/'));

mongoose.connect(
  config.mongoose.uri,
  function (err) {
  if(err) throw err;
});

app.use(express.cookieParser());
app.use(express.bodyParser());
app.use(express.session({ secret: 'wunderlist' }));

app.use(busboyBodyParser());
 
app.use(passport.initialize());
app.use(passport.session());

passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  User.findById(id, function(err, user) {
    done(err, user);
  });
});

var io = require('socket.io').listen(server);

app.all('*', function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header('Access-Control-Allow-Methods', 'OPTIONS,GET,POST,PUT,DELETE');
    res.header("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With");
    if ('OPTIONS' == req.method){
        return res.send(200);
    }
    next();
});

app.post('/login', authCtrl.login);
app.post('/register', authCtrl.register);
app.put('/user:id', authCtrl.changeProfile)

app.get('/user', authCtrl.getUser);

app.get('/lists', listsCtrl.getLists);

app.post('/list', listsCtrl.newList);
app.get('/list:id', listsCtrl.getTasks);
app.put('/list:id', listsCtrl.updateListName);
app.delete('/list:id', listsCtrl.deleteList);

app.get('/task:id', tasksCtrl.getTask)
app.post('/task', tasksCtrl.newTask);
app.put('/task:id', tasksCtrl.updateTask);
app.delete('/task:id', tasksCtrl.deleteTask);

app.post('/invite', listsCtrl.invite);
app.put('/invite:id', listsCtrl.acceptInvite);

app.post('/file', tasksCtrl.createFile);
app.delete('/file:id', tasksCtrl.deleteFile);

app.post('/subtask', tasksCtrl.newSubtask);
app.put('/subtask:id', tasksCtrl.changeSubtask);
app.delete('/subtask:id', tasksCtrl.deleteSubtask);

module.exports.io = io;