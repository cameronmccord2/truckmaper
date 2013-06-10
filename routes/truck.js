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

exports.new = function(req, res){
	if(req.query.token == undefined || req.query.token == null || req.query.token == ''){
		res.send(401, 'Missing token');
		res.end();
	}
	if(req.headers.id == undefined || req.headers.id == null || req.headers.id == ''){
		res.send(401, 'Missing truck id');
		res.end();
	}
}

exports.editTruck = function(req, res){
	if(req.query.token == undefined || req.query.token == null || req.query.token == ''){
		res.send(401, 'Missing token');
		res.end();
	}
	if(req.headers.id == undefined || req.headers.id == null || req.headers.id == ''){
		res.send(401, 'Missing truck id');
		res.end();
	}
	console.log("editTruck how: " + req.get('whatField'));
	if(req.get('whatField') == undefined || req.get('whatField') == null){
		res.send(500, "Missing whatField");
		res.end();
		return;
	}
	if(req.get('whatField') == "all"){
		Db.connect(url,function(err,db){
			if(err){
				res.send(500,"error connecting to db");
				res.end();
				return;
			}else{
				var collection = db.collection("trucks");
				collection.update({_id:ObjectId(req.body._id)},req.body,function(err,result){
					if(err){
						console.log("error on updateTruck method for: " + req.get('whatField'));
						res.send(400);
					}else{
						console.log("result: " + result);
						res.send(200);
					}
					db.close();
					res.end();
				});
			}
		});
	}else{
		Db.connect(url,function(err,db){
			if(err){
				res.send(500,"error connecting to db");
				res.end();
				return;
			}else{
				var collection = db.collection('trucks');
				var boolValue = req.get('fieldData') == "true"? true : false;
				var specifics;
				if(req.get('whatField') == "year")
					specifics = {$set:{year:parseInt(req.get('fieldData')),lastEdited:(new Date()).getTime()}};
				else if(req.get('whatField') == "miles")
					specifics = {$set:{miles:parseInt(req.get('fieldData')),lastEdited:(new Date()).getTime()}};
				else if(req.get('whatField') == "price")
					specifics = {$set:{price:parseInt(req.get('fieldData')),lastEdited:(new Date()).getTime()}};
				else if(req.get('whatField') == "stockNumber")
					specifics = {$set:{stockNumber:parseInt(req.get('fieldData')),lastEdited:(new Date()).getTime()}};
				else if(req.get('whatField') == "make")
					specifics = {$set:{make:req.get('fieldData'),lastEdited:(new Date()).getTime()}};
				else if(req.get('whatField') == "model")
					specifics = {$set:{model:req.get('fieldData'),lastEdited:(new Date()).getTime()}};
				else if(req.get('whatField') == "color")
					specifics = {$set:{color:req.get('fieldData'),lastEdited:(new Date()).getTime()}};
				else if(req.get('whatField') == "engine")
					specifics = {$set:{engine:req.get('fieldData'),lastEdited:(new Date()).getTime()}};
				else if(req.get('whatField') == "transmission")
					specifics = {$set:{transmission:req.get('fieldData'),lastEdited:(new Date()).getTime()}};
				else if(req.get('whatField') == "notes")
					specifics = {$set:{notes:req.get('fieldData'),lastEdited:(new Date()).getTime()}};
				else if(req.get('whatField') == "vin")
					specifics = {$set:{vin:req.get('fieldData'),lastEdited:(new Date()).getTime()}};
				else if(req.get('whatField') == "engineModel")
					specifics = {$set:{engineModel:req.get('fieldData'),lastEdited:(new Date()).getTime()}};
				else if(req.get('whatField') == "horsepower")
					specifics = {$set:{horsepower:req.get('fieldData'),lastEdited:(new Date()).getTime()}};
				else if(req.get('whatField') == "def")
					specifics = {$set:{def:req.get('fieldData'),lastEdited:(new Date()).getTime()}};
				else if(req.get('whatField') == "axleRatio")
					specifics = {$set:{axleRatio:req.get('fieldData'),lastEdited:(new Date()).getTime()}};
				else if(req.get('whatField') == "needsImage")
					specifics = {$set:{needsImage:boolValue,lastEdited:(new Date()).getTime()}};
				else if(req.get('whatField') == "images")
					specifics = {$set:{images:req.get('fieldData'),lastEdited:(new Date()).getTime()}};
				else if(req.get('whatField') == "defaultImage")
					specifics = {$set:{defaultImage:req.get('fieldData'),lastEdited:(new Date()).getTime()}};
				else if(req.get('whatField') == "precidence")
					specifics = {$set:{precidence:parseInt(req.get('fieldData')),lastEdited:(new Date()).getTime()}};
				else if(req.get('whatField') == "timesClicked")
					specifics = {$set:{timesClicked:parseInt(req.get('fieldData')),lastEdited:(new Date()).getTime()}};
				else if(req.get('whatField') == "adminNotes")
					specifics = {$set:{adminNotes:req.get('fieldData'),lastEdited:(new Date()).getTime()}};
				else if(req.get('whatField') == "status")
					specifics = {$set:{status:parseInt(req.get('fieldData')),lastEdited:(new Date()).getTime()}};
				else if(req.get('whatField') == "tileImage")
					specifics = {$set:{tileImage:req.get('fieldData'),lastEdited:(new Date()).getTime()}};
				else if(req.get('whatField') == "largeImage")
					specifics = {$set:{largeImage:req.get('fieldData'),lastEdited:(new Date()).getTime()}};
				else{
					console.log("whatField is invalid: " + req.get('whatField'));
					res.send(500, "whatField is invalid: " + req.get('whatField'));
					db.close();
					res.end();
					return;
				}
				collection.update({_id:ObjectId(req.get('id'))}, specifics, function(err,result){
					if(err){
						console.log("error on find method for: " + req.get('whatField') + " with info: " + req.get('fieldData'));
						res.send(400);
						db.close();
						res.end();
						return;
					}else{
						res.send(200,'1');
						db.close();
						res.end();
					}
				});
			}
		});
	}
}



// Truck Image
exports.allNeedsImage = function(req,res){
	Db.connect(url,function(err,db){
		if(err){
			res.send(500,"error connecting to db");
			res.end();
			return;
		}else{
			var collection = db.collection("trucks");
			collection.find({needsImage:true}).toArray(function(err,result){
				if(err){
					console.log("error retrieving all trucks that need images");
					res.send(500,"error retrieving all trucks that need images");
				}else{
					console.log("found trucks that need images");
					res.json(200,result);
				}
				db.close();
				res.end();
				return;
			});
		}
	});
}

// Truck data mantinence
exports.removeTruck = function(req,res){
	Db.connect(url,function(err,db){
		if(err){
			res.send(500,"error connecting to db");
			res.end();
			return;
		}else{
			var trucksCollection = db.collection("trucks");
			var soldTrucksCollection = db.collection("soldTrucks");
			trucksCollection.find({_id:ObjectId(req.params.stockNumber)}).toArray(function(err, result1){
				if(err){
					console.log("cannot find stuff by stockNumber: " + req.params.stockNumber);
					res.send(500,"cannot find stuff by stockNumber: " + req.params.stockNumber);
					db.close();
					res.end();
				}else{
					console.log(result1)
					soldTrucksCollection.insert(result1, function(err,result2){
						if(err){
							console.log("error adding found trucks into sold trucks");
							console.log(result2)
							res.send(500,"error adding found trucks into sold trucks");
							db.close();
							res.end();
						}else{
							trucksCollection.remove({_id:ObjectId(req.params.stockNumber)}, function(err,result3){
								console.log(result3)
								if(err){
									console.log("could not remove found trucks from trucks");
									res.send(500,"could not remove found trucks from trucks");
									db.close();
									res.end();
								}else{
									trucksCollection.find().toArray(function(err, result4){
										if(err){
											console.log("couldnt read truck database again");
											res.send(500,"couldnt read truck database again");
										}else{
											res.send(200,result4);
										}
										db.close();
										res.end();
									});
								}
							})
						}
					});
				}
			});
		}
	});
}



exports.addTruck = function(req,res){
	var imagesArray = new Array();
	var blankImage = new Object();
	blankImage.tileFilename = 'noImageYet.jpg';
	blankImage.largeFilename = 'noImageYet_large.jpg';
	blankImage.takenBy = 'initial';
	blankImage.date = (new Date()).getTime();
	imagesArray.push(blankImage);
	var truckData = {
		'year':0,
		'miles':0,
		'price':0,
		'stockNumber':0,
		'make':'',
		'model':'',
		'color':'',
		'engine':'',
		'transmission':'',
		'notes':'',
		'vin':'',
		'engineModel':'',
		'horsepower':'',
		'def':'',
		'axleRatio':'',
		'precidence':100,
		'adminNotes':'',
		'status':2,
		//defaults
		'needsImage':true,
		'images':imagesArray,
		'tileImage':blankImage.tileFilename,
		'largeImage':blankImage.largeFilename,
		'timesClicked':0,
		'dateAdded':(new Date()).getTime(),
		'lastEdited':(new Date()).getTime()
	}
	Db.connect(url,function(err,db){
		if(err){
			res.send(500,"error connecting to db");
			res.end();
			return;
		}else{
			var collection = db.collection('trucks');
			collection.insert(truckData,function(err,result){
				if(err){
					console.log("error inserting new truck into trucks")
					res.send(500,"error inserting new truck into trucks");
					db.close();
					res.end();
				}else{
					res.send(200, result);
				}
				db.close();
				res.end();
			});
		}
	});
}

// same as clientTruckData without the field restrictions
exports.allTrucks = function(req,res){
	Db.connect(url,function(err,db){
		if(err){
			res.send(500,"error connecting to db");
			res.end();
			return;
		}else{
		var collection = db.collection('trucks');
			collection.find().toArray(function(err,trucks){
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
				collection.findOne({stockNumber:req.params.stockNumber}, function(err, data){
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

exports.specificTruckId = function(req,res){
	console.log("specific: " + req.params.id);
	if(req.params.id != undefined){
		Db.connect(url,function(err,db){
			if(err){
				res.send(500,"error connecting to db");
				res.end();
				return;
			}else{
				var collection = db.collection('trucks');
				collection.findOne({_id:ObjectId(req.params.id)}, function(err, data){
					if(err){
						console.log("error finding one truck: " + err);
						res.send(400, "Error");
					}else{
						if(data == null){
							console.log("invalid id: " + req.params.id);
							res.send(412, "invalid id: " + req.params.id);
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