// Begin mongodb required stuff
var Db = require('mongodb').Db;
var Connection = require('mongodb').Connection;
var Server = require('mongodb').Server;
var ObjectId = require('mongodb').ObjectID;
var fs = require('fs');

var nodeSessionId = Math.floor(Math.random()*10000);

var url = "mongodb://54.214.247.68:27017/truckMap";
console.log("Mongo url: " + url);
// End mongodb required stuff

exports.getDbConnection = function(req, res, next){
	Db.connect(url,function(err,db){
		if(err){
			res.send(500,"error connecting to db" + err);
			res.end();
			return;
		}
		req.db = db;
		next();
	}
}

exports.getUserFromToken = function(req, res, next){
	var tokenCollection = req.db.collection('currentTokens');
	tokenCollection.find(token:req.query.token, function(err, tokens){
		if(err){
			console.log("error on find token method");
			res.send(500, "error on find token method");
			req.db.close();
			res.end();
			return;
		}else{
			var usersCollection = req.db.collection('users');
			usersCollection.find({_id:ObjectId(tokens[0].userId)}, function(err, users){
				if(err){
					console.log("error on find user method");
					res.send(500, "error on find user method");
					req.db.close();
					res.end();
					return;
				}else{
					if(users.length != 1){
						res.send(500, 'incorrect number of users found: ' + users.length);
						console.log('incorrect number of users found: ' + users.length);
						req.db.close();
						res.end();
						return;
					}
					req.user = users[0];
					next();
				}
			});
		}
	});
}




exports.dropCollection = function(req,res){
	if(req.get('dropWhich') == undefined){
		res.send("ERROR");
		res.end();
	}
	else
		Db.connect(url,function(err,db){
			var collection = db.collection(req.get('dropWhich'));
			collection.drop();
			collection.count(function(err,count){
				if(err)
					console.log("count errorrr")
				console.log("there are " + count + " records.");
				res.send("the count is: " + count + " in table " + req.get('dropWhich'));
				res.end();
				db.close();
			});
		});
}

exports.setup = function(req,res){
	console.log("in setup")
	var checkedForDataUpdate = false;
	var truckData = {"stuff":"not"};
	var http = require('http');
	var awsPort = 8001;
	var awsIpAddress = '54.225.66.110';
	var useNewData = false;
	var nodeSessionId = Math.floor(Math.random()*10000);
	var options = {
	    host: awsIpAddress,
	    port: awsPort,
	    path: '/truck/getData',
	    method: 'GET',
	    headers: {
	    	'iWant': 'all',
	    	'nodeSessionId': nodeSessionId
	    }
	};
	var requ = http.request(options, function(resp){
	    console.log("truck data recieved from " + options.host + ":" + options.port + options.path);
	    var result = [];
	    resp.on('data', function(chunk){
	        result.push(chunk);
	        //console.log("got piece");
	    });
	    resp.on('end', function(){
	    	truckData = JSON.parse(result.join(''));
	    	useNewData = true;
	    	//console.log(truckData);
	    	console.log("got truck data again");
	    	for (var i = truckData.trucks.length - 1; i >= 0; i--) {
	    		var imagesArray = new Array();
	    		var blankImage = new Object();
	    		blankImage.tileFilename = 'noImageYet.jpg';
	    		blankImage.largeFilename = 'noImageYet_large.jpg';
	    		blankImage.takenBy = 'initial';
	    		blankImage.date = (new Date()).getTime();
	    		imagesArray.push(blankImage);
	    		var initalImage = new Object();
	    		initalImage.tileFilename = truckData.trucks[i].stockNumber + '/0.jpg';
	    		initalImage.largeFilename = truckData.trucks[i].stockNumber + '/0.jpg';
	    		initalImage.takenBy = 'script';
	    		initalImage.date = (new Date()).getTime();
	    		imagesArray.push(initalImage);
	    		truckData.trucks[i].needsImage = false;
	    		truckData.trucks[i].images = imagesArray;
	    		truckData.trucks[i].tileImage = imagesArray[1].tileFilename;
	    		truckData.trucks[i].largeImage = imagesArray[1].largeFilename;
	    		truckData.trucks[i].precidence = 100;
	    		truckData.trucks[i].timesClicked = 0;
	    		truckData.trucks[i].dateAdded = (new Date()).getTime();
	    		truckData.trucks[i].lastEdited = truckData.trucks[i].dateAdded;
	    		truckData.trucks[i].adminNotes = "";
	    		truckData.trucks[i].status = 2;
	    		truckData.trucks[i].year = truckData.trucks[i].theYear;
	    		delete truckData.trucks[i].theYear;
	    	};
	    	Db.connect(url,function(err,db){
	    		var collection = db.collection("trucks");
	    		collection.insert(truckData.trucks,{w:1}, function(docs){
	    			collection.count(function(err,count){
	    				if(err){
	    					console.log("count errorrr");
	    					res.send(500,"count error");
	    				}else{
		    				console.log("there are " + count + " records.");
		    				res.send(200,"the count is: " + count);
		    			}
	    			});
	    		});
	    	});
	    });
	}).on('error', function(e){
	    console.log('ERROR: ' + e.message);
	});
	requ.write('nada');
	requ.end();
}