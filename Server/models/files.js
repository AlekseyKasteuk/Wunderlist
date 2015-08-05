var mongoose = require('mongoose');
var Grid = require('gridfs-stream');
var fs = require('fs');
var app = require('../../app')
var gfs;
var config = require('../config/config')

var conn = mongoose.createConnection(config.mongoose.uri);

conn.once('open', function() {

    gfs = Grid( conn.db, mongoose.mongo );
});

exports.create = function(req, res) {
	var part = req.files.file;
	if(part.type.split('/')[0] != 'image') {
		res.send(400);
		return;
	}
    var writeStream = gfs.createWriteStream({
        filename: part.name,
		mode: 'w',
        content_type:part.type,
        metadata: {
        	task: req.body.task
        }
    });
    writeStream.on('finish', function() {
    	readFiles(req.body.task);
         res.status(200).send({
			message: 'Success'
		});
    });
    fs.createReadStream(part.path).pipe(writeStream);
};
 
 
function readFiles (task) {
	if(!task) {
		return;
	}
	gfs.files.find({metadata: {task: task.toString()}}).toArray(function (err, files) {
 	    if(files.length===0){
			return;
 	    }
 	    files.forEach(function (file) {
 	    	var data = [];
 	    	var readstream = gfs.createReadStream({
			  filename: file.filename,
			  chunkSize: 838860800
			});
		    readstream.on('data', function(d) {
		        data.push(d);

		    });
		    readstream.on('end', function() {
		        app.io.emit('getFiles', {info: {id: file._id, type: file.contentType, name: file.filename, task: file.metadata.task}, data: data}) 
		    });
 	    })
	});
};

exports.read = readFiles;

exports.deleteFile = function (req, res) {
	gfs.remove({_id: req.params.id}, function () {
		app.io.emit('deleteFile', req.params.id);
	})
	res.send(200);
}

exports.deleteFilesOfTask = function (task) {
	gfs.files.find({metadata: {task: task}}).toArray(function (err, files) {
		files.forEach(function (file) {
			gfs.remove({_id: file._id}, function () { })
		})
	})
}