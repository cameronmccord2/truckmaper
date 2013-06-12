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

var companyRequiredKeys = [
	'companyName', 'companyPhone', 'companyEmail', 'companyStreet1', 'companyCity', 'companyState', 'companyCountry', 
	'companyZip', 'mainContactName', 'mainContactPhone', 'mainContactEmail'
];

var companyOptionalKeys = [
	'companyStreet2'
];

var companyArrays = [
	'changeLog', 'contractDetails'
];



exports.newCompany = function(req, res){
	for(key in companyRequiredKeys){
		if(req.body[key] == undefined || req.body[key] == null || req.body[key] == ''){
			res.send(400, 'Missing token: ' + key);
			res.end();
			return;
		}else
			newCompanyObject[key] = res.body[key];
	}
	for(key in companyOptionalKeys){
		if(req.body[key] == undefined || req.body[key] == null){
			res.send(400, 'Missing token: ' + key);
			res.end();
			return;
		}else if(req.body[key] == '')
			newCompanyObject[key] = '';
		else
			newCompanyObject[key] = req.body[key];
	}
	for(key in companyArrays){
		newCompanyObject[key] = new Array();
	}
	var userMonths = new Object();
	var monthArray = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];
	var yearsArray = [2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023];
	var tempMonth = 1;
	var tempYear = 13;
	for (var j = 0; j < 10; j++) {
		for (var i = 0; i < 12; i++) {
			userMonths[monthArray[i] + String(yearsArray[j])] = {
				'month':monthArray[i],
				'year':yearsArray[j],
				'monthNum':i,
				'maxUsers':0,
				'currentUsers':0,
				'usersThisMonth': new Array(),
				'changesThisMonth': new Array()
			};
		};
	};
	newCompanyObject.userMonths = new Object();
	newCompanyObject.userMonths
}

exports.getCompanyInfo = function(req, res){
	if(isTokenMissing(req)){
		res.send(401, 'Missing token');
		res.end();
	}
}

exports.editCompanyInfo = function(req, res){
	if(isTokenMissing(req)){
		res.send(401, 'Missing token');
		res.end();
	}
}