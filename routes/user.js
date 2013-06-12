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

var logLoginLogoutAttempt = function(userId, attempt){
	Db.connect(url,function(err,db){
		if(err){
			res.send(500,"error connecting to db" + err);
			res.end();
		}else{
			collection.update({_id:ObjectId(userId)},{$push:{loginHistory:attempt}},function(err,result){
				if(err){
					console.log("error pushing login attempt");
					db.close();
				}else{
					console.log("login attempt logged");
					db.close();
				}
			});
		}
	});
}

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
			collection.find({username:req.query.username},{name:1, rights:1, username:1, password:1}).toArray()(function(err, users){
				if(err){
					console.log("error on find username method");
					res.send(400,"error on find username method");
					db.close();
					res.end();
				}else{
					var loginAttempt;
					if(users[0].password == req.query.password){
						var collection2 = db.collection('currentTokens');
						var tokenData = {
							'token':token,
							'userId':users[0]._id,
							'rights': users[0].rights
						};
						collection2.insert(tokenData, function(err, result){
							if(err){
								console.log("error on find username method");
								res.send(400,"error on find username method");
								db.close();
								res.end();
							}
						});
						var resultData = {
							'token':tokenData.token,
							'name':users[0].name
						};
						res.json(resultData);
						loginAttempt = {
							'when':(new Date()).getTime(),
							'type':'login',
							'success':true
						};
					}else{
						res.send(400, 'invalidPassword');
						loginAttempt = {
							'when':(new Date()).getTime(),
							'type':'login',
							'success':false
						};
					}
					logLoginLogoutAttempt(users[0]._id, loginAttempt);
					db.close();
					res.end();
				}
			});
		}
	});
}

exports.logout = function(req, res){
	if(isTokenMissing(req)){
		res.send(401, 'Missing token');
		res.end();
	}
	Db.connect(url,function(err,db){
		if(err){
			res.send(500,"error connecting to db" + err);
			res.end();
			return;
		}else{
		var collection = db.collection('currentTokens');
			collection.find({token:req.query.token},{}).toArray(function(err, tokens){
				if(err){
					console.log("error on find token method");
					res.send(400,"error on find token method");
					db.close();
					res.end();
				}else{
					var logoutAttempt;
					if(tokens.length == 0){
						loginAttempt = {
							'when':(new Date()).getTime(),
							'type':'logout',
							'success':false
						};
						res.send(401, 'token does not exist');
						db.close();
						res.end();
					}else if(tokens.length > 1){
						logoutAttempt = {
							'when':(new Date()).getTime(),
							'type':'logout',
							'success':false
						};
						res.send(500, 'tokens are messed up');
						db.close();
						res.end();
					}else{
						logoutAttempt = {
							'when':(new Date()).getTime(),
							'type':'logout',
							'success':true
						};
						collection.remove({token:req.query.token},{});// remove token from active tokens
					}
					logLoginLogoutAttempt(tokens.userId, logoutAttempt);
					db.close();
					res.end();
				}
			});
		}
	});
}

exports.userData = function(req, res){
	if(isTokenMissing(req)){
		res.send(401, 'Missing token');
		res.end();
	}
	Db.connect(url,function(err,db){
		if(err){
			res.send(500,"error connecting to db" + err);
			res.end();
			return;
		}else{
			var collection = db.collection('users');
			collection.find({_id:ObjectId(userId)},{name:1, email:1, rights:1}).toArray(function(err, users){
				if(err){
					console.log("error on find token method");
					res.send(400,"error on find token method");
					db.close();
					res.end();
				}else{
					if(users.length != 1){
						console.log('user data not found');
						res.send(401, 'user data not found');
					}else{
						console.log('user data sent');
						res.json(users[0]);
					}
					db.close();
					res.end();
				}
			});
		}
	});
}

var newUserKeysRequired = [
	'firstName', 'lastName', 'email', 'username', 'password', 'companyId', 'question1', 'question2', 'question3', 'answer1', 'answer2', 'answer3'
];
var newUserKeysOptional = [
	'phoneNumber'
];

var newUserRights = {
	'editItem':false,
	'newItem':false,
	'getLocation':false,
	'setLocation':false,
	'editCompany':false,
	'itemsSimple':false,
	'itemsComplex':false,
	'allItems':false,
	'editHistory':false
};

exports.newUser = function(req, res){
	var newUserProfile = new Object();
	for (key in newUserKeysRequired) {
		if(req.body[key] == undefined || req.body[key] == null || req.body[key] == ''){
			res.send(401, 'Missing token: ' + key);
			res.end();
			return;
		}else{
			newUserProfile[key] = req.body[key];
		}
	};
	for(key in newUserKeysOptional){
		if(req.body[newUserKeysOptional[i]] == undefined || req.body[newUserKeysOptional[i]] == null || req.body[newUserKeysOptional[i]] == '')
			newUserProfile[key] = '';
		else
			newUserProfile[key] = req.body[key];
	};
	newUserProfile['createdDate'] = (new Date()).getTime();
	Db.connect(url,function(err,db){
		if(err){
			res.send(500,"error connecting to db" + err);
			res.end();
			return;
		}else{
			var companiesCollection = db.collection('companies');
			companiesCollection.find({companyId:req.body.companyId},{}).toArray(function(err, companies){
				if(err){
					res.send(500,"error find companyId to db" + err);
					res.end();
					return;
				}else{
					if(companies.length == 0){
						console.log('no company by that id exists');
						res.send(200, 'invalidCompanyId');
						db.close();
						res.end();
					}else if(companies.length > 1){
						console.log('companyId error');
						res.send(500, 'companyId error');
						db.close();
						res.end();
					}else{
						if(companies[0].userCount < companies[0].userCountMax){
							newUserProfile.userCountWhenCreated = companies[0].userCount;
							newUserProfile.companyId = companies[0]._id;
							newUserProfile.rights = newUserRights;
							var usersCollection = db.collection('users');
							usersCollection.insert(newUserProfile, function(err, result){
								if(err){
									res.send(500,"error insert new user profile to db" + err);
									res.end();
									return;
								}else{
									var newUserForCompany = {
										'createdDate':newUserProfile.createdDate,
										'id':newUserProfile._id
									};
									companiesCollection.update({_id:ObjectId(companies[0]._id)}, {$push:{users:newUserForCompany}}, function(err, result1){
										if(err){
											res.send(500,"error update newUserForCompany to db" + err);
											res.end();
											return;
										}else{
											res.send(200, 'newUserCreateSuccess');
											console.log('newUserCreateSuccess');
										}
										db.close();
										res.end();
									});
								}
							});
						}else{
							res.send(500, 'max user count reached');
							console.log('max user count reached');
						}
					}
				}
			})
		}
	});
}

exports.doesUsernameExist = function(req, res){
	if(req.body.username == undefined || req.body.username == null || req.body.username == ''){
		res.send(401, 'Missing token');
		res.end();
	}
	Db.connect(url,function(err,db){
		if(err){
			res.send(500,"error connecting to db" + err);
			res.end();
			return;
		}else{
		var collection = db.collection('users');
			collection.find({username:req.query.username},{username:1}).toArray()(function(err, users){
				if(err){
					console.log("error on find username method");
					res.send(400,"error on find username method");
					db.close();
					res.end();
				}else{
					var loginAttempt;
					if(users.length == 0){
						res.send(200, 'doesntExist');
					}else{
						res.send(200, 'exists');
					}
					db.close();
					res.end();
				}
			});
		}
	});
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