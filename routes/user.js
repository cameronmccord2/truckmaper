// Begin includes
var ObjectId = require('mongodb').ObjectID;
var fs = require('fs');
// End includes

var logLoginLogoutAttempt = function(userId, attempt, req){
	var usersCollection = req.db.collection('users');
	usersCollection.update({_id:ObjectId(userId)},{$push:{loginHistory:attempt}},function(err,result){
		if(err){
			console.log("error pushing login attempt");
			req.db.close();
			return 'error';
		}else{
			console.log("login attempt logged");
			return '';
		}
	});
}

exports.login = function(req, res){
	if(req.query.username == undefined || req.query.username == null || req.query.username == ''){
		res.send(400, 'Missing user query param');
		req.db.close();
		res.end();
		return;
	}
	if(req.query.password == undefined || req.query.password == null || req.query.password == ''){
		res.send(400, 'Missing password query param');
		req.db.close();
		res.end();
		return;
	}
	var usersCollection = req.db.collection('users');
		usersCollection.find({username:req.query.username},{name:1, rights:1, username:1, password:1}).toArray()(function(err, users){
			if(err){
				console.log("error on find username method");
				res.send(400,"error on find username method");
				req.db.close();
				res.end();
			}else{
				var loginAttempt;
				if(req.user.password == req.query.password){
					var tokensCollection = req.db.collection('currentTokens');
					var tokenData = {
						'token':token,
						'userId':req.user._id,
						'rights': req.user.rights
					};
					tokensCollection.insert(tokenData, function(err, result){
						if(err){
							console.log("error on find username method");
							res.send(400,"error on find username method");
							req.db.close();
							res.end();
						}
					});
					var resultData = {
						'token':tokenData.token,
						'name':req.user.name
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
				if(logLoginLogoutAttempt(req.user._id, loginAttempt, req) == 'error')
					console.log('error in login logout attempt');
				req.db.close();
				res.end();
			}
		});
	}
}

exports.logout = function(req, res){
	var logoutAttempt;
	var tokenCollection = req.db.collection('currentTokens');
	if(tokens.length == 0){
		loginAttempt = {
			'when':(new Date()).getTime(),
			'type':'logout',
			'success':false
		};
		res.send(401, 'token does not exist');
		req.db.close();
		res.end();
	}else if(tokens.length > 1){
		logoutAttempt = {
			'when':(new Date()).getTime(),
			'type':'logout',
			'success':false
		};
		res.send(500, 'tokens are messed up');
		req.db.close();
		res.end();
	}else{
		logoutAttempt = {
			'when':(new Date()).getTime(),
			'type':'logout',
			'success':true
		};
		collection.remove({token:req.query.token},{});// remove token from active tokens
	}
	if(logLoginLogoutAttempt(req.user._id, loginAttempt, req) == 'error')
		console.log('error in login logout attempt');
	req.db.close();
	res.end();
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
		var companiesCollection = req.db.collection('companies');
		companiesCollection.find({companyId:req.body.companyId},{}).toArray(function(err, companies){
			if(err){
				res.send(500,"error find companyId to db" + err);
				res.end();
				return;
			}else{
				if(companies.length == 0){
					console.log('no company by that id exists');
					res.send(200, 'invalidCompanyId');
					req.db.close();
					res.end();
				}else if(companies.length > 1){
					console.log('companyId error');
					res.send(500, 'companyId error');
					req.db.close();
					res.end();
				}else{
					if(companies[0].userCount < companies[0].userCountMax){
						newUserProfile.userCountWhenCreated = companies[0].userCount;
						newUserProfile.companyId = companies[0]._id;
						newUserProfile.rights = newUserRights;
						var usersCollection = req.db.collection('users');
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
									req.db.close();
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
		});
	});
}

exports.doesUsernameExist = function(req, res){
	if(req.body.username == undefined || req.body.username == null || req.body.username == ''){
		res.send(401, 'Missing token');
		res.end();
	}
	var usersCollection = req.db.collection('users');
		usersCollection.find({username:req.query.username},{username:1}).toArray()(function(err, users){
			if(err){
				console.log("error on find username method");
				res.send(400,"error on find username method");
				req.db.close();
				res.end();
			}else{
				var loginAttempt;
				if(users.length == 0){
					res.send(200, 'doesntExist');
				}else{
					res.send(200, 'exists');
				}
				req.db.close();
				res.end();
			}
		});
	}
}