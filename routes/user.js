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

exports.login = function(req, res){
	if(req.query.username == undefined || req.query.username == null || req.query.username == ''){
		res.send(400, 'Missing user query param');
		res.end();
		return;
	}
	if(req.query.password == undefined || req.query.password == null || req.query.password == ''){
		res.send(400, 'Missing password query param');
		res.end();
		return;
	}
	Db.connect(url,function(err,db){
		if(err){
			res.send(500,"error connecting to db" + err);
			res.end();
			return;
		}else{
		var collection = db.collection('users');
			collection.find({username:req.query.username},{}).toArray()(function(err, users){
				if(err){
					console.log("error on find username method");
					res.send(400,"error on find username method");
					db.close();
					res.end();
				}else{
					if(users[0].password == req.query.password){
						res.json();
						db.close();
						
					}
				}
			});
		}
	});
}

exports.logout = function(req, res){

}

exports.userData = function(req, res){
	if(req.headers.id == undefined || req.headers.id == null || req.headers.id == ''){
		res.send(401, 'Missing token');
		res.end();
	}
}



exports.allTrucks = function(req,res){
	Db.connect(url,function(err,db){
		if(err){
			res.send(500,"error connecting to db" + err);
			res.end();
			return;
		}else{
		var collection = db.collection('trucks');
			collection.find({status:2},{
				miles:1,
				price:1,
				stockNumber:1,
				make:1,
				model:1,
				color:1,
				engine:1,
				transmission:1,
				notes:1,
				vin:1,
				engineModel:1,
				horsepower:1,
				def:1,
				axleRatio:1,
				images:1,
				tileImage:1,
				largeImage:1,
				precidence:1,
				year:1
			}).toArray(function(err,trucks){
				if(err){
					console.log("error on find method");
					res.send(400,"error on find method");
				}else{
					console.log('got all trucks, preparing setup data');
					var setup = new Object();
					setup.minMiles = trucks[trucks.length - 1].miles;
					setup.maxMiles = setup.minMiles;
					setup.minPrice = trucks[trucks.length - 1].price;
					setup.maxPrice = setup.minPrice;
					setup.minYear  = trucks[trucks.length - 1].year;
					setup.maxYear  = setup.minYear;
					var makes = new Array();
					for (var i = trucks.length - 2; i >= 0; i--) {
						if(trucks[i].miles < setup.minMiles)setup.minMiles = trucks[i].miles;
						else if(trucks[i].miles > setup.maxMiles) setup.maxMiles = trucks[i].miles;
						if(trucks[i].price < setup.minPrice)setup.minPrice = trucks[i].price;
						else if(trucks[i].price > setup.maxPrice) setup.maxPrice = trucks[i].price;
						if(trucks[i].year < setup.minYear)setup.minYear = trucks[i].year;
						else if(trucks[i].year > setup.maxYear) setup.maxYear = trucks[i].year;
						var makeNew = true;
						for (var j = makes.length - 1; j >= 0; j--) {
							if(makes[j].name == trucks[i].make){
								makes[j].number++;
								makeNew = false;
								j = -1
							}
						};
						if(makeNew){
							var tempMake = new Object();
							tempMake.name = trucks[i].make;
							tempMake.number = 1;
							makes.push(tempMake);
						}
					};
					var finalData = new Object();
					finalData.setup = setup;
					finalData.makes = makes;
					finalData.trucks = trucks;
					res.json(200, finalData);
				}
				db.close();
				res.end();
			});
		}
	});
}

exports.specificTruck = function(req,res){
	console.log("specific: " + req.params.stockNumber);
	if(req.params.stockNumber != undefined){
		Db.connect(url,function(err,db){
			if(err){
				res.send(500,"error connecting to db");
				res.end();
				return;
			}else{
				var collection = db.collection('trucks');
				collection.findOne({stockNumber:req.params.stockNumber},{
					miles:1,
					price:1,
					stockNumber:1,
					make:1,
					model:1,
					color:1,
					engine:1,
					transmission:1,
					notes:1,
					vin:1,
					engineModel:1,
					horsepower:1,
					def:1,
					axleRatio:1,
					images:1,
					tileImage:1,
					largeImage:1,
					precidence:1,
					year:1
				}, function(err, data){
					if(err){
						console.log("error finding one truck: " + err);
						res.send(400, "Error");
					}else{
						if(data == null){
							console.log("invalid stockNumber: " + req.params.stockNumber);
							res.send(412, "invalid stockNumber: " + req.params.stockNumber);
						}else{
							res.json(200,data);
						}
					}
					db.close();
					res.end();
				});
			}
		});
	}
	else{
		res.send("ERROR");
		res.end();
	}
}