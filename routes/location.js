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

exports.updateLocationIos = function(req, res){
	if(isTokenMissing(req)){
		res.send(401, 'Missing token');
		res.end();
	}
}

exports.updateLocationAndroid = function(req, res){
	if(isTokenMissing(req)){
		res.send(401, 'Missing token');
		res.end();
	}
}

exports.updateLocationWebsite = function(req, res){
	if(isTokenMissing(req)){
		res.send(401, 'Missing token');
		res.end();
	}
}

exports.getLocationIos = function(req, res){
	if(isTokenMissing(req)){
		res.send(401, 'Missing token');
		res.end();
	}
}

exports.getLocationAndroid = function(req, res){
	if(isTokenMissing(req)){
		res.send(401, 'Missing token');
		res.end();
	}
}

exports.getLocationWebsite = function(req, res){
	if(isTokenMissing(req)){
		res.send(401, 'Missing token');
		res.end();
	}
}



exports.newContact = function(req,res){
	console.log("new contact");
	if(req.body.clientSessionId == undefined || req.body.clientSessionId == null){
		console.log('missing clientSessionId')
		res.send(500, "missing clientSessionId");
		res.end();
		return;
	}

	// setup new contact object for db
	var contact = new Object();
	contact.name = req.body.name;
	contact.email = req.body.email;
	contact.phoneNumber = req.body.phoneNumber;
	contact.whenBestContact = req.body.whenBestContact;
	contact.comment = req.body.comment;
	contact.clientSessionId = req.body.clientSessionId;
	contact.nodeSessionId = nodeSessionId;
	contact.timeRecieved = (new Date()).getTime();
	contact.phoneNumber = "";
	contact.truckStockNumber = req.body.truckStockNumber;
	contact.adminComment = "";
	contact.lastContacted = 0;
	contact.status = 11;
	contact.historyEntries = new Array();

	Db.connect(url,function(err,db){
		if(err){
			res.send(500,"error connecting to db");
			res.end();
			return;
		}else{
			var collection = db.collection('truckContacts');
			collection.insert(contact, function(err, result){
				if(err){
					console.log(err);
					res.send(500, "Error inserting contact: " + err);
				}else{
					if(req.body.name == result[0].name){
						res.send(200);
						console.log("successful contact insert")
					}
					else{
						console.log("result contact from mongo does not match input");
						res.send(500, "result contact from mongo does not match input");
					}
				}
				db.close();
				res.end();
			});
		}
	});
}