// Begin mongodb required stuff
var Db = require('mongodb').Db;
var Connection = require('mongodb').Connection;
var Server = require('mongodb').Server;
var ObjectId = require('mongodb').ObjectID;
var fs = require('fs');

var nodeSessionId = Math.floor(Math.random()*10000);
// winServer2012 - winServer2012 - 54.235.66.182 - cameronmccord3@gmail.com - 2759-9812-7528
// webServer1 - myWebServers - 54.225.66.110 - cameronmccord3@gmail.com - 2759-9812-7528
// nodeServer1 - cam4UbuntuKey - 54.214.238.10 - cameronmccord4@gmail.com - 5993-7832-3978
// mongodbNode1 - cluster-keypair - 54.214.247.68 - cameronmccord5@gmail.com - 4751-2487-5947
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
		console.log("got db connection")
		next();
	});
}

exports.closeDb = function(req, res, next){
	console.log("close db");
	req.db.close();
	next();
}

exports.endResponse = function(req, res, next){
	res.end();
}

exports.getUserFromToken = function(req, res, next){
	var tokenCollection = req.db.collection('currentTokens');
	console.log(req.query.token)
	tokenCollection.find({token:req.query.token}, function(err, tokens){
		if(err)
			sendError(req, res, 500, "error on find token method", true);
		else{
			console.log(tokens);
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