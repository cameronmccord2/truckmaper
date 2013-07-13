var sendError = function(req, res, status, message, closeAndEnd, consoleLogSpecific){
	console.log(consoleLogSpecific || message);
	res.send(status, message);
	if(closeAndEnd){
		req.db.close();
		res.end();
	}
}

exports.checkForToken = function(req, res, next){
	// (new Date()).getTime().toString(36) generates a 8 digit key
	if(req.query.token == undefined || req.query.token == null || req.query.token == '')
		sendError(req, res, 401, 'Missing authorization token', true);
	else if(req.query.token.length != 30)
		sendError(req, res, 401, 'Token is not 30 characters long', true);
	else if(req.query.token.substr(-8) < (new Date()).getTime().toString(36))
		sendError(req, res, 401, 'Token is expired', true);
	else
		next();
}

exports.dumb = function(req, res){
	res.send(200, 'Hit dumb');
	req.db.close();
	res.end();
}