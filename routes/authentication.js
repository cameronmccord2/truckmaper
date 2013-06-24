var sendError = function(req, res, status, message, closeAndEnd, consoleLogSpecific){
	console.log(consoleLogSpecific || message);
	res.send(status, message);
	if(closeAndEnd){
		req.db.close();
		res.end();
	}
}

exports.checkForToken = function(req, res, next){
	if(req.query.token == undefined || req.query.token == null || req.query.token == ''){
		sendError(req, res, 401, 'Missing token', true);
	else
		next();
}