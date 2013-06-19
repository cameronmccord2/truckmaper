//Start global authentication
var isTokenMissing = function(req){
	
}
//End global authentication

exports.checkForToken = function(req, res, next){
	if(req.query.token == undefined || req.query.token == null || req.query.token == ''){
		console.log('missing token');
		res.send(401, 'Missing token');
		res.end();
		return;
	}
	next();
}