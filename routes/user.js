// Begin includes
var ObjectId = require('mongodb').ObjectID;
var fs = require('fs');
// End includes

var logLoginLogoutAttempt = function(userId, attempt, req){
	var usersCollection = req.db.collection('users');
	console.log(userId.toString().length)
	usersCollection.update({_id:ObjectId(userId)}, {$push:{loginHistory:attempt}}, function(err,result){
		if(err){
			console.log("db error pushing login attempt");
			return 'error';
		}else{
			console.log("login attempt logged");
			return '';
		}
	});
}

var sendError = function(req, res, status, message, closeAndEnd, consoleLogSpecific){
	console.log(consoleLogSpecific || message);
	res.send(status, message);
	if(closeAndEnd){
		req.db.close();
		res.end();
	}
}

var generateToken = function(){
    // this Math.floor(Math.random()*100000000000000000000000000000000).toString(36) generates a 22 digit key 86% of the time
    // (new Date()).getTime().toString(36) generates a 8 digit key
    do{
    	var token = Math.floor(Math.random()*1000000000000000000000000000000000).toString(36) + (new Date()).getTime().toString(36);
    }while(token.length != 30);
    return token;
}

var loginKeysRequired = ['username', 'password'];

exports.login = function(req, res){
	console.log('login request');
	var userLogin = new Object();
	for (key in loginKeysRequired) {
		if(req.query[loginKeysRequired[key]] == undefined || req.query[loginKeysRequired[key]] == null || req.query[loginKeysRequired[key]] == ''){
			sendError(req, res, 401, 'Missing token: ' + loginKeysRequired[key], true);
			return;
		}else{
			userLogin[loginKeysRequired[key]] = req.query[loginKeysRequired[key]];
		}
	};
	var usersCollection = req.db.collection('users');
	usersCollection.find({username:userLogin.username},{name:1, rights:1, username:1, password:1}).toArray(function(err, users){
		if(err){
			sendError(req, res, 400, "error on find username method", true);
			return;
		}else{
			var loginAttempt;
			if(users.length == 0){
				sendError(req, res, 400, 'usernameInvalid', true, "username doesnt exist in database");
				return;
			}
			else if(users.length != 1){
				sendError(req, res, 500, "users number is: " + users.length + ", expedted 1", true);
				return;
			}
			req.user = users[0];
			if(req.user.password == userLogin.password){
				var tokensCollection = req.db.collection('currentTokens');
				var tokenData = {
					'userId': req.user._id,
					'rights': req.user.rights,
					'token': generateToken()
				};
				tokensCollection.insert(tokenData, function(err, result){
					if(err){
						sendError(req, res, 400, "error on find username method", true);
						return;
					}
				});
				var resultData = {
					'token':tokenData.token,
					'name': req.user.name
				};
				res.json(resultData);
				loginAttempt = {
					'when':(new Date()).getTime(),
					'type':'login',
					'success':true
				};
			}else{
				sendError(req, res, 400, 'invalidPassword', false);
				loginAttempt = {
					'when':(new Date()).getTime(),
					'type':'login',
					'success':false
				};
			}
			console.log(req.user._id)
			logLoginLogoutAttempt(req.user._id.toString(), loginAttempt, req);
			req.db.close();
			res.end();
		}
	});
}

exports.logout = function(req, res){
	if(req.user == undefined){
		sendError(req, res, 500, "user is invalid, fix that", true);
		return;
	}
	var logoutAttempt;
	var tokenCollection = req.db.collection('currentTokens');
	tokenCollection.find({_id:ObjectId(req.token)}, function(err, tokens){
		if(err){
			sendError(req, res, 500, "error on find token for logout", true);
			return;
		}
		if(tokens.length == 0){
			loginAttempt = {
				'when':(new Date()).getTime(),
				'type':'logout',
				'success':false
			};
			sendError(req, res, 401, 'notLoggedIn', false, "token does not exist");
		}else if(tokens.length > 1){
			sendError(req, res, 500, 'tokens are messed up', true);
			return;
		}else{
			logoutAttempt = {
				'when':(new Date()).getTime(),
				'type':'logout',
				'success':true
			};
			tokenCollection.remove({token:req.query.token},{}, function(err, result){
				if(err){
					sendError(req, res, 500, "error on remove token for logout", true);
					return;
				}
				console.log('token removed');
			});// remove token from active tokens
		}
		logLoginLogoutAttempt(req.user._id, loginAttempt, req);
		req.db.close();
		res.end();
	});
}

exports.userData = function(req, res){
	console.log('user data sent');
	res.json(req.user);
	req.db.close();
	res.end();
}

var newUserKeysRequired = [
	'firstName', 'lastName', 'email', 'username', 'password'
];
var newUserKeysOptional = [
	'phoneNumber', 'companyId', 'question1', 'question2', 'question3', 'answer1', 'answer2', 'answer3'
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
	console.log("here")
	var newUserProfile = new Object();
	for (key in newUserKeysRequired) {
		if(req.query[newUserKeysRequired[key]] == undefined || req.query[newUserKeysRequired[key]] == null || req.query[newUserKeysRequired[key]] == ''){
			sendError(req, res, 401, 'Missing token: ' + newUserKeysRequired[key], true);
			return;
		}else{
			newUserProfile[newUserKeysRequired[key]] = req.query[newUserKeysRequired[key]];
		}
	};
	for(key in newUserKeysOptional){
		if(req.query[newUserKeysOptional[key]] == undefined || req.query[newUserKeysOptional[key]] == null || req.query[newUserKeysOptional[key]] == '')
			newUserProfile[newUserKeysOptional[key]] = '';
		else
			newUserProfile[newUserKeysOptional[key]] = req.query[newUserKeysOptional[key]];
	};
	newUserProfile['createdDate'] = (new Date()).getTime();
	console.log(newUserProfile)
	if(newUserProfile.companyId != ''){
		var companiesCollection = req.db.collection('companies');
		companiesCollection.find({companyId:req.body.companyId},{}).toArray(function(err, companies){
			if(err){
				sendError(req, res, 500, "error find companyId to db" + err, true);
			}else{
				if(companies.length == 0){
					sendError(req, res, 200, 'invalidCompanyId', true);
				}else if(companies.length > 1){
					sendError(req, res, 500, 'companyId error', true);
				}else{
					if(companies[0].userCount < companies[0].userCountMax){
						newUserProfile.userCountWhenCreated = companies[0].userCount;
						newUserProfile.companyId = companies[0]._id;
						newUserProfile.rights = newUserRights;
						var usersCollection = req.db.collection('users');
						usersCollection.insert(newUserProfile, function(err, result){
							if(err){
								sendError(req, res, 500, "error insert new user profile to db" + err, true);
							}else{
								var newUserForCompany = {
									'createdDate':newUserProfile.createdDate,
									'id':newUserProfile._id
								};
								companiesCollection.update({_id:ObjectId(companies[0]._id)}, {$push:{users:newUserForCompany}}, function(err, result1){
									if(err){
										sendError(req, res, 500, "error update newUserForCompany to db" + err, false);
									}else{
										res.send(200, 'newUserCreateSuccess');
										console.log('newUserCreateSuccess');
									}
									req.db.close();
									res.end();
								});
							}
						});
					}else{
						sendError(req, res, 500, 'max user count reached', true);
					}
				}
			}
		});
	}else{
		// TODO disallow usernames that already exist - error: "Username already exists", 401
		newUserProfile.rights = newUserRights;
		var usersCollection = req.db.collection('users');
		usersCollection.find({username:newUserProfile.username},{username:1}).toArray(function(err, users){
			if(err)
				sendError(req, res, 400,"error on find username method", true);
			else{
				if(users.length == 0){
					usersCollection.insert(newUserProfile, function(err, result){
						if(err){
							sendError(req, res, 500, "error insert new user profile to db" + err, false);
						}else{
							res.send(200, 'newUserCreateSuccess, ' + newUserProfile._id);
							console.log('newUserCreateSuccess');
						}
						req.db.close();
						res.end();
					});
				}
				else
					sendError(req, res, 401, "Username already exists");
			}
		});
	}
}

exports.doesUsernameExist = function(req, res){
	if(req.query.username == undefined || req.query.username == null || req.query.username == ''){
		sendError(req, res, 400, 'Missing username', true);
		return;
	}
	if(req.query.username.length < 5){
		sendError(req, res, 400, 'Username too short, should be more than 5', true);
		return;
	}
	if(req.query.username.length >= 20){
		sendError(req, res, 400, 'Username too long, should be less than 20', true);
		return;
	}
	var username = req.query.username;
	var usersCollection = req.db.collection('users');
	usersCollection.find({username:username},{username:1}).toArray(function(err, users){
		if(err)
			sendError(req, res, 400,"error on find username method", false);
		else{
			console.log(users);
			if(users.length == 0)
				res.send(200, 'doesntExist');
			else
				res.send(200, 'exists');
		}
		req.db.close();
		res.end();
	});
}





































