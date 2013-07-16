var Db = require('mongodb').Db;
var url = "mongodb://54.214.247.68:27017/";

exports.clearTokens = function(req, res){
	// console.log(req.db)
	console.log('in clear tokens');
	var currentTokens = req.db.collection('currentTokens');
	currentTokens.remove({}, function(err, result){
		if(err)
			res.send(500, "couldnt do remove on currentTokens, error");
		else{
			res.send(200, 'result: ' + result);
			console.log("cleared " + result + " tokens");
		}
		req.db.close();
		res.end();
	});
}

exports.clearUsers = function(req, res){
	console.log('in clear users');
	var users = req.db.collection('users');
	users.remove({}, function(err, result){
		if(err)
			res.send(500, "couldnt do remove on users, error");
		else{
			res.send(200, 'result: ' + result);
			console.log("cleared " + result + " users");
		}
		req.db.close();
		res.end();
	});
}

exports.dropGarbageDbs = function(req, res){
	var dbs = {
		dropped:new Array(),
		all:new Array()
	};
	Db.connect(url + 'blankDbs', function(err, db){
		if(err){
			sendError(req, res, 500,"error connecting to db" + err, true);
			return;
		}
		db.collection('databases').distinct('name', function(err, result){
			if(err){
				sendError(req, res, 500, "error on insert database name into blankDbs.databases", true);
				return;
			}
			dbs.all = result;
			for (var i = result.length - 1; i >= 0; i--) {
				Db.connect(url + result[i], function(err, db1){
					if(err){
						sendError(req, res, 500,"error connecting to db" + err, true);
						return;
					}
						db1.dropDatabase();
						dbs.dropped.push(result[i]);
						db1.close();
				});
			};

			db.close();
			res.send(200, dbs);
			res.end();
		});
	});
	req.db.close();
}

exports.checkDb = function(req, res){
	Db.connect(url + req.params.dbName, function(err, db){
		if(err){
			sendError(req, res, 500,"error connecting to db" + err, true);
			return;
		}
		db.collection('currentTokens').find().toArray(function(err, result){
			if(err){
				sendError(req, res, 500,"error connecting to db" + err, true);
				return;
			}
			res.json(200, result);
			db.close();
			res.end();
		});
	});
	req.db.close();
}

exports.dropBlankDbs = function(req, res){
	Db.connect(url + 'blankDbs', function(err, db){
		if(err){
			sendError(req, res, 500,"error connecting to db" + err, true);
			return;
		}
		db.collection('databases').drop();
		db.close();
		res.send(200, 'dropped blankDbs.databases');
		res.end();
	});
	req.db.close();
}