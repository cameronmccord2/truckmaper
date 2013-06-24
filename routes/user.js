// Begin includes
var ObjectId = require('mongodb').ObjectID;
var fs = require('fs');
// End includes

var logLoginLogoutAttempt = function(userId, attempt, req){
	var usersCollection = req.db.collection('users');
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

exports.login = function(req, res){
	console.log('login request')
	console.log(req.body)
	if(req.body.username == undefined || req.body.username == null || req.body.username == ''){
		sendError(req, res, 400, 'Missing username in body', true);
		return;
	}
	if(req.body.password == undefined || req.body.password == null || req.body.password == ''){
		sendError(req, res, 400, 'Missing password in body', true);
		return;
	}
	var usersCollection = req.db.collection('users');
	usersCollection.find({username:req.body.username},{name:1, rights:1, username:1, password:1}).toArray(function(err, users){
		if(err){
			sendError(req, res, 400, "error on find username method", true);
			return;
		}else{
			var loginAttempt;
			if(users.length == 0){
				sendError(req, res, 400, 'usernameInvalid', true, "username doesnt exist in database");
				return;
			}else if(users.length != 1){
				sendError(req, res, 500, "users is: " + users.length + ", expedted 1", true);
				return;
			}else if(req.user.password == req.body.password){
				var tokensCollection = req.db.collection('currentTokens');
				var tokenData = {
					'userId': users[0]._id,
					'rights': users[0].rights
				};
				tokensCollection.insert(tokenData, function(err, result){
					if(err){
						sendError(req, res, 400, "error on find username method", true);
						return;
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
				sendError(req, res, 400, 'invalidPassword', false);
				loginAttempt = {
					'when':(new Date()).getTime(),
					'type':'login',
					'success':false
				};
			}
			logLoginLogoutAttempt(req.user._id, loginAttempt, req);
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
			sendError(req, res, 401, 'Missing token: ' + key, true);
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
	var companiesCollection = req.db.collection('companies');
	companiesCollection.find({companyId:req.body.companyId},{}).toArray(function(err, companies){
		if(err){
			sendError(req, res, 500,"error find companyId to db" + err, true);
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
							sendError(req, res, 500,"error insert new user profile to db" + err, true);
						}else{
							var newUserForCompany = {
								'createdDate':newUserProfile.createdDate,
								'id':newUserProfile._id
							};
							companiesCollection.update({_id:ObjectId(companies[0]._id)}, {$push:{users:newUserForCompany}}, function(err, result1){
								if(err){
									sendError(req, res, 500,"error update newUserForCompany to db" + err, false);
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
}

exports.doesUsernameExist = function(req, res){
	if(req.body.username == undefined || req.body.username == null || req.body.username == ''){
		sendError(req, res, 500, 'Missing username', true);
		return;
	}
	var usersCollection = req.db.collection('users');
	usersCollection.find({username:req.body.username},{username:1}).toArray(function(err, users){
		if(err)
			sendError(req, res, 400,"error on find username method", false);
		else{
			if(users.length == 0)
				res.send(200, 'doesntExist');
			else
				res.send(200, 'exists');
		}
		req.db.close();
		res.end();
	});
}