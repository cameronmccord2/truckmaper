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
var url = "mongodb://54.214.247.68:27017/";
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
	console.log("asdfasdfasdf")
	var newUrl = url;
	if(req.query.useDatabase != undefined){
		newUrl += req.query.useDatabase;
		Db.connect(url + 'blankDbs', function(err, db){
			if(err){
				sendError(req, res, 500,"error connecting to db" + err, true);
				return;
			}
			var databaseUsed = {
				name:req.query.useDatabase
			};
			db.collection('databases').insert(databaseUsed, function(err, result){
				if(err){
					sendError(req, res, 500, "error on insert database name into blankDbs.databases", true);
					return;
				}
				console.log("using database: " + req.query.useDatabase);
				db.close();
			});
		});
	}else
		newUrl += 'serverTester';
	Db.connect(newUrl, function(err, db){
		if(err){
			sendError(req, res, 500,"error connecting to db" + err, true);
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
	tokenCollection.find({token:req.query.token}).toArray(function(err, tokens){
		if(err)
			sendError(req, res, 500, "error on find token method", true);
		else{
			if(tokens.length == 0){
				sendError(req, res, 401, "Token does not exist", true);
			}else if(tokens.length != 1){
				sendError(req, res, 500, "Multiple identical tokens found, fix that", true);
			}else{
				var usersCollection = req.db.collection('users');
				usersCollection.find({_id:ObjectId(tokens[0].userId.toString())}).toArray(function(err, users){
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
		}
	});
}