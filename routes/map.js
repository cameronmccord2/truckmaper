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

//Start global authentication
var isTokenMissing = function(req){
	if(req.query.token == undefined || req.query.token == null || req.query.token == ''){
		return true;
	}else
		return false;
}
//End global authentication

exports.allTrucksComplex = function(req, res){
	if(isTokenMissing(req)){
		res.send(401, 'Missing token');
		res.end();
	}
}

exports.allTrucksSimple = function(req, res){
	if(isTokenMissing(req)){
		res.send(401, 'Missing token');
		res.end();
	}
}

exports.truckComplexId = function(req, res){
	if(isTokenMissing(req)){
		res.send(401, 'Missing token');
		res.end();
	}
}



exports.logClick = function(req,res){
	console.log(req.body.clickId)
	if(req.body.clickId == undefined || req.body.clientSessionId == undefined ||
		req.body.clickId == null || req.body.clientSessionId == null){
		console.log("missing required clickId or clientSessionId in body");
		res.send(400,"missing required clickId or clientSessionId in body");
		res.end();
	}else{
		var click = {
			'clickId': req.body.clickId,
			'clientSessionId': req.body.clientSessionId,
			'nodeSessionId':nodeSessionId,
			'timeRecieved':(new Date()).getTime(),
		}
		if(req.body.clickData1 == undefined || req.body.clickData1 == null)
			click.clickData1 = "";
		else
			click.clickData1 = req.body.clickData1;
		if(req.body.clickData2 == undefined || req.body.clickData2 == null)
			click.clickData2 = "";
		else
			click.clickData2 = req.body.clickData2;
		if(req.body.stockNumber == undefined || req.body.stockNumber == null)
			click.stockNumber = "";
		else{
			click.stockNumber = req.body.stockNumber;
			Db.connect(url,function(err,db){
				if(err){
					res.send(500, "error connecting to db to log click on truck");
					res.end();
					return;
				}else{
					var collection2 = db.collection('trucks');
					collection2.update({stockNumber:req.body.stockNumber},{$inc:{timesClicked:1}},function(err,result){
						if(err){
							res.send(500, "error updating click on the truck: " + req.body.stockNumber);
							db.close();
							res.end();
							return;
						}else{
							console.log("click logged on truck");
							db.close();
						}
					});
				}
			});
		}
		Db.connect(url,function(err,db){
			if(err){
				res.send(500,"error connecting to db");
				res.end();
				return;
			}else{
				var collection = db.collection('truckClicks');
				collection.insert(click, function(err, result){
					if(err){
						console.log(err);
						res.send(500, "Error inserting click");
					}else{
						if(req.body.clickId == result[0].clickId){
							console.log("click logged in truckClicks")
							res.send(200);
						}
						else{
							console.log("result click from mongo does not match input");
							res.send(500, "result click from mongo does not match input");
						}
					}
					res.end();
					db.close();
				});
			}
		});
	}
}