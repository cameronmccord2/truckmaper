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