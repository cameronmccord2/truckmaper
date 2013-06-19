// method authentication stuff
exports.new method = function(req, res){
	var checkForRights = new Array();

	for(right in checkForRights){
		if(!req.user.rights[right]){
			res.send(401, 'insufficientRights');
			req.db.close();
			res.end();
			return;
		}
	}
}