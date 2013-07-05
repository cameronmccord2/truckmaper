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