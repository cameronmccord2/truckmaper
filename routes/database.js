// Begin mongodb required stuff
var Db = require('mongodb').Db;
var Connection = require('mongodb').Connection;
var Server = require('mongodb').Server;
var ObjectId = require('mongodb').ObjectID;
var fs = require('fs');

var nodeSessionId = Math.floor(Math.random()*10000);

var url = "mongodb://54.214.247.68:27017/serverTester";
console.log("Mongo url: " + url);
// End mongodb required stuff

var collectionNames = {
	page:'page'
};

var sendError = function(req, res, status, message, closeAndEnd, consoleLogSpecific){
	console.log(consoleLogSpecific || message);
	res.send(status, message);
	if(closeAndEnd){
		req.db.close();
		res.end();
	}
}

exports.getDbConnection = function(req, res, next){
	Db.connect(url,function(err,db){
		if(err){
			sendError(req, res, 500,"error connecting to db" + err, false);
			return;
		}
		req.db = db;
		req.collectionNames = collectionNames;
		next();
	});
}

exports.getUserFromToken = function(req, res, next){
	var tokenCollection = req.db.collection('currentTokens');
	tokenCollection.find({token:req.query.token}, function(err, tokens){
		if(err)
			sendError(req, res, 500, "error on find token method", true);
		else{
			var usersCollection = req.db.collection('users');
			usersCollection.find({_id:ObjectId(tokens[0].userId)}, function(err, users){
				if(err)
					sendError(req, res, 500, "error on find user method", true);
				else{
					if(users.length != 1)
						sendError(req, res, 500, 'incorrect number of users found: ' + users.length, true);
					else{
						req.user = users[0];
						next();
					}
				}
			});
		}
	});
}