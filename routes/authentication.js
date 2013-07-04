var sendError = function(req, res, next, status, message, closeAndEnd, consoleLogSpecific){
	console.log(consoleLogSpecific || message);
	res.send(status, message);
	if(closeAndEnd)
		next();
}

exports.checkForToken = function(req, res, next){
	console.log('checking for token');
	if(req.query.token == undefined || req.query.token == null || req.query.token == '')
		sendError(req, res, next, 401, 'Missing token', true);
	else
		next();
}

exports.test2 = function(req, res, next){
	console.log("in test2");
	req.send(200, "mememe");
	next();
}