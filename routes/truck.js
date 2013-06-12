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

var requiredItemKeys = [
	'stockNumber', 'vin', 'color', 'qrCode', 'model', 'make', 'year', 'status'
];

var optionalItemKeys = [
	'transmission', 'axleRatio', 'notes', 'engine', 'engineModel', 'miles', 'price', 'def', 'notes'
];

var truckStatuses = [
	{'num':5, 'word':'new', 'realWord':'New - On lot'},
	{'num':2, 'word':'soldOnLot', 'realWord':'Sold - Still on the lot'},
	{'num':3, 'word':'soldOffLot', 'realWord':'Sold - Off the lot'},
	{'num':4, 'word':'inactiveOnLot', 'realWord':'Inactive - On lot'},
	{'num':1, 'word':'inactiveSetupIncomplete', 'realWord':'Inactive - Not set up yet'}
];

var truckTypes = [
	{'num':1, 'word':'uncategorized', 'realWord':'Uncategorized'},
	{'num':2, 'word':'new', 'realWord':'New'},
	{'num':3, 'word':'used', 'realWord':'Used'}
];

var truckLocationStatuses = [
	{'num':1, 'word':'uncategorized', 'realWord':'Uncategorized'},
	{'num':2, 'word':'onLot', 'realWord':'On the lot'},
	{'num':3, 'word':'offLot', 'realWord':'Off the lot'},
	{'num':4, 'word':'inShop', 'realWord':'In the shop'}
];

exports.newItem = function(req, res){
	if(isTokenMissing(req)){
		console.log('missing token');
		res.send(401, 'Missing token');
		res.end();
		return;
	}
	Db.connect(url,function(err,db){
		if(err){
			res.send(500,"error connecting to db" + err);
			res.end();
			return;
		}else{
			var tokenCollection = db.collection('currentTokens');
			tokenCollection.find(token:req.query.token, function(err, tokens){
				if(err){
					console.log("error on find token method");
					res.send(400, "error on find token method");
					db.close();
					res.end();
				}else{
					var usersCollection = db.collection('users');
					usersCollection.find({_id:ObjectId(tokens[0].userId)}, function(err, users){
						if(err){
							console.log("error on find user method");
							res.send(400, "error on find user method");
							db.close();
							res.end();
						}else{
							if(users.length != 1){
								res.send(500, 'incorrect number of users found: ' + users.length);
								console.log('incorrect number of users found: ' + users.length);
								db.close();
								res.end();
							}else{
								if(!users[0].rights.newItem){
									res.send(401, 'insufficientRights');
									db.close();
									res.end();
								}else{
									var newItemObject = new Object();
									for(key in requiredItemKeys){
										newItemObject[key] = '';
									}
									for(key in optionalItemKeys){
										newItemObject[key] = '';
									}
									newItemObject['companyId'] = users[0].companyId;
									newItemObject['createdBy'] = users[0]._id;
									newItemObject['createdDate'] = (new Date()).getTime();
									newItemObject['status'] = 1;
									newItemObject['type'] = 1;
									newItemObject['locationStatus'] = 1;
									newItemObject['edits'] new Array();
									newItemObject['currentLocation'] = {loc:{type:'Point', coordinates:[0, 0]}};
									var itemCollection = db.collection('items');
									itemsCollection.insert(newItemObject, function(err, result){
										if(err){
											console.log("error on insert new item method");
											res.send(400, "error on insert new item method");
										}else{
											res.json(newItemObject);
										}
										db.close();
										res.end();
									});
								}
							}
						}
					});
				}
			});
		}
	});
}

exports.editItem = function(req, res){
	if(isTokenMissing(req)){
		console.log('missing token');
		res.send(401, 'Missing token');
		res.end();
		return;
	}
	Db.connect(url,function(err,db){
		if(err){
			res.send(500,"error connecting to db" + err);
			res.end();
			return;
		}else{
			var tokenCollection = db.collection('currentTokens');
			tokenCollection.find(token:req.query.token, function(err, tokens){
				if(err){
					console.log("error on find token method");
					res.send(400, "error on find token method");
					db.close();
					res.end();
				}else{
					var usersCollection = db.collection('users');
					usersCollection.find({_id:ObjectId(tokens[0].userId)}, function(err, users){
						if(err){
							console.log("error on find user method");
							res.send(400, "error on find user method");
							db.close();
							res.end();
						}else{
							if(users.length != 1){
								res.send(500, 'incorrect number of users found: ' + users.length);
								console.log('incorrect number of users found: ' + users.length);
								db.close();
								res.end();
							}else{
								if(!users[0].rights.editItem){
									res.send(401, 'insufficientRights');
									db.close();
									res.end();
								}else{
									var itemsCollection = db.collection('items');
									var boolValue = req.get('fieldData') == "true"? true : false;
									var theSet;
									if(req.get('whatField') == "year"){
										theSet = {year:parseInt(req.get('fieldData'))};
									}else if(req.get('whatField') == "qrCode"){
										theSet = {qrCode:parseInt(req.get('fieldData'))};
									}else if(req.get('whatField') == "miles"){
										theSet = {miles:req.get('fieldData')};
									}else if(req.get('whatField') == "price"){
										theSet = {price:parseInt(req.get('fieldData'))};
									}else if(req.get('whatField') == "stockNumber"){
										theSet = {stockNumber:parseInt(req.get('fieldData'))};
									}else if(req.get('whatField') == "make"){
										theSet = {make:req.get('fieldData')};
									}else if(req.get('whatField') == "model"){
										theSet = {model:req.get('fieldData')};
									}else if(req.get('whatField') == "color"){
										theSet = {color:req.get('fieldData')};
									}else if(req.get('whatField') == "engine"){
										theSet = {engine:req.get('fieldData')};
									}else if(req.get('whatField') == "transmission"){
										theSet = {transmission:req.get('fieldData')};
									}else if(req.get('whatField') == "notes"){
										theSet = {notes:req.get('fieldData')};
									}else if(req.get('whatField') == "vin"){
										theSet = {vin:req.get('fieldData')};
									}else if(req.get('whatField') == "engineModel"){
										theSet = {engineModel:req.get('fieldData')};
									}else if(req.get('whatField') == "horsepower"){
										theSet = {horsepower:req.get('fieldData')};
									}else if(req.get('whatField') == "def"){
										theSet = {def:req.get('fieldData')};
									}else if(req.get('whatField') == "axleRatio"){
										theSet = {axleRatio:req.get('fieldData')};
									}else if(req.get('whatField') == "status"){
										theSet = {status:parseInt(req.get('fieldData'))};
									}else if(req.get('whatField') == "type"){
										theSet = {type:parseInt(req.get('fieldData'))};
									}else if(req.get('whatField') == "locationStatus"){
										theSet = {locationStatus:parseInt(req.get('fieldData'))};
									}else if(req.get('whatField') == "location"){
										theSet = {currentLocation:{loc:{type:'Point', coordinates:[req.get('longitude'), req.get('latitude')]}}};
									}else{
										console.log("whatField is invalid: " + req.get('whatField'));
										res.send(500, "whatField is invalid: " + req.get('whatField'));
										db.close();
										res.end();
										return;
									}
									itemsCollection.update({_id:ObjectId(req.get('id'))}, {$set:theSet, $push:{edits:{edit:theSet, whenSet:(new Date()).getTime(), editedByWho:users[0]._id};}}, function(err,result){
										if(err){
											console.log("error on find method for: " + req.get('whatField') + " with info: " + req.get('fieldData'));
											res.send(400);
										}else
											res.send(200, result);
										db.close();
										res.end();
									});
								}
							}
						}
					});
				}
			});
		}
	});
}

exports.editHistory = function(req, res){
	if(isTokenMissing(req)){
		console.log('missing token');
		res.send(401, 'Missing token');
		res.end();
		return;
	}
	Db.connect(url,function(err,db){
		if(err){
			res.send(500,"error connecting to db" + err);
			res.end();
			return;
		}else{
			var tokenCollection = db.collection('currentTokens');
			tokenCollection.find(token:req.query.token, function(err, tokens){
				if(err){
					console.log("error on find token method");
					res.send(400, "error on find token method");
					db.close();
					res.end();
				}else{
					var usersCollection = db.collection('users');
					usersCollection.find({_id:ObjectId(tokens[0].userId)}).toArray(function(err, users){
						if(err){
							console.log("error on find user method");
							res.send(400, "error on find user method");
							db.close();
							res.end();
						}else{
							if(users.length != 1){
								res.send(500, 'incorrect number of users found: ' + users.length);
								console.log('incorrect number of users found: ' + users.length);
								db.close();
								res.end();
							}else{
								var checkForRights = new Array();
								checkForRights.push('editHistory');
								for(right in checkForRights){
									if(!users[0].rights[right]){
										res.send(401, 'insufficientRights');
										db.close();
										res.end();
									}
								}
								
							}
						}
					});
				}
			});
		}
	});
}

var itemsSimple = {

};

var itemsComplex = {
	edits:0
};

exports.allItems = function(req, res){
	if(isTokenMissing(req)){
		console.log('missing token');
		res.send(401, 'Missing token');
		res.end();
		return;
	}
	Db.connect(url,function(err,db){
		if(err){
			res.send(500,"error connecting to db" + err);
			res.end();
			return;
		}else{
			var tokenCollection = db.collection('currentTokens');
			tokenCollection.find(token:req.query.token, function(err, tokens){
				if(err){
					console.log("error on find token method");
					res.send(400, "error on find token method");
					db.close();
					res.end();
				}else{
					var usersCollection = db.collection('users');
					usersCollection.find({_id:ObjectId(tokens[0].userId)}).toArray(function(err, users){
						if(err){
							console.log("error on find user method");
							res.send(400, "error on find user method");
							db.close();
							res.end();
						}else{
							if(users.length != 1){
								res.send(500, 'incorrect number of users found: ' + users.length);
								console.log('incorrect number of users found: ' + users.length);
								db.close();
								res.end();
							}else{
								var whatTypeOfRequest;
								var whatTypeOfData;
								var findParams;
								var checkForRights = new Array();
								if(req.query.id != undefined && req.query.id != null && req.query.id != ''){
									whatTypeOfRequest = 'specific';
									findParams = {_id:ObjectId(req.query.id)};
								}else{
									whatTypeOfRequest = 'all';
									checkForRights.push('allItems');
									findParams = {companyId:users[0].companyId};
								}
								var whichFields;
								if(req.query.data != undefined && req.query.data != null && req.query.data != ''){
									if(req.query.data == 'location'){
										whatTypeOfData = 'location';
										checkForRights.push('getLocation');
										whichFields = locationItemFields;
									}else if(req.query.data == 'simple'){
										whatTypeOfData = 'simple';
										checkForRights.push('itemsSimple');
										whichFields = simpleItemFields;
									}else if(req.query.data == 'complex'){
										whatTypeOfData = 'complex';
										checkForRights.push('itemsComplex');
										whichFields = complexItemFields;
									}
								}
								for(right in checkForRights){
									if(!users[0].rights[right]){
										res.send(401, 'insufficientRights');
										db.close();
										res.end();
									}
								}
								var itemsCollection = db.collection('items');
								itemsCollection.find(findParams,whichFields).toArray(function(err, items){
									if(err){
										console.log("error on find user method");
										res.send(400, "error on find user method");
									}else
										res.json(items);
									db.close();
									res.end();
								});
							}
						}
					});
				}
			});
		}
	});
}