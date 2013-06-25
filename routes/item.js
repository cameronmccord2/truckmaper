// Begin includes
var ObjectId = require('mongodb').ObjectID;
var fs = require('fs');
// End includes

var requiredItemKeys = [
	'stockNumber', 'vin', 'color', 'qrCode', 'model', 'make', 'year', 'status'
];

var optionalItemKeys = [
	'transmission', 'axleRatio', 'notes', 'engine', 'engineModel', 'miles', 'price', 'def', 'notes'
];

var truckStatuses = [
	{'num':5, 'word':'new', 'realWord':'New - On lot'},
	{'num':2, 'word':'soldOnLot', 'realWord':'Sold - Still on the lot'},
	{'num':3, 'word':'soldOffLot', 'realWord':'Sold - Off the lot'},
	{'num':4, 'word':'inactiveOnLot', 'realWord':'Inactive - On lot'},
	{'num':1, 'word':'inactiveSetupIncomplete', 'realWord':'Inactive - Not set up yet'}
];

var truckTypes = [
	{'num':1, 'word':'uncategorized', 'realWord':'Uncategorized'},
	{'num':2, 'word':'new', 'realWord':'New'},
	{'num':3, 'word':'used', 'realWord':'Used'}
];

var truckLocationStatuses = [
	{'num':1, 'word':'uncategorized', 'realWord':'Uncategorized'},
	{'num':2, 'word':'onLot', 'realWord':'On the lot'},
	{'num':3, 'word':'offLot', 'realWord':'Off the lot'},
	{'num':4, 'word':'inShop', 'realWord':'In the shop'}
];

var sendError = function(req, res, status, message, closeAndEnd, consoleLogSpecific){
	console.log(consoleLogSpecific || message);
	res.send(status, message);
	if(closeAndEnd){
		req.db.close();
		res.end();
	}
}

exports.newItem = function(req, res){
	if(!req.user.rights.newItem)
		sendError(req, res, 401, 'insufficientRights', true);
	else{
		var newItemObject = new Object();
		for(key in requiredItemKeys){
			newItemObject[key] = '';
		}
		for(key in optionalItemKeys){
			newItemObject[key] = '';
		}
		newItemObject['companyId'] = req.user.companyId;
		newItemObject['createdBy'] = req.user._id;
		newItemObject['createdDate'] = (new Date()).getTime();
		newItemObject['status'] = 1;
		newItemObject['type'] = 1;
		newItemObject['locationStatus'] = 1;
		newItemObject['edits'] = new Array();
		newItemObject['currentLocation'] = {loc:{type:'Point', coordinates:[0, 0]}};
		var itemCollection = req.db.collection('items');
		itemsCollection.insert(newItemObject, function(err, result){
			if(err)
				sendError(req, res, 500, "error on insert new item method", false);
			else
				res.json(newItemObject);
			req.db.close();
			res.end();
		});
	}
}

exports.editItem = function(req, res){
	if(!req.user.rights.editItem)
		sendError(req, res, 401, 'insufficientRights', true);
	else{
		var itemsCollection = req.db.collection('items');
		var boolValue = req.get('fieldData') == "true"? true : false;
		var theSet;
		if(req.get('whatField') == "year"){
			theSet = {year:parseInt(req.get('fieldData'))};
		}else if(req.get('whatField') == "qrCode"){
			theSet = {qrCode:parseInt(req.get('fieldData'))};
		}else if(req.get('whatField') == "miles"){
			theSet = {miles:req.get('fieldData')};
		}else if(req.get('whatField') == "price"){
			theSet = {price:parseInt(req.get('fieldData'))};
		}else if(req.get('whatField') == "stockNumber"){
			theSet = {stockNumber:parseInt(req.get('fieldData'))};
		}else if(req.get('whatField') == "make"){
			theSet = {make:req.get('fieldData')};
		}else if(req.get('whatField') == "model"){
			theSet = {model:req.get('fieldData')};
		}else if(req.get('whatField') == "color"){
			theSet = {color:req.get('fieldData')};
		}else if(req.get('whatField') == "engine"){
			theSet = {engine:req.get('fieldData')};
		}else if(req.get('whatField') == "transmission"){
			theSet = {transmission:req.get('fieldData')};
		}else if(req.get('whatField') == "notes"){
			theSet = {notes:req.get('fieldData')};
		}else if(req.get('whatField') == "vin"){
			theSet = {vin:req.get('fieldData')};
		}else if(req.get('whatField') == "engineModel"){
			theSet = {engineModel:req.get('fieldData')};
		}else if(req.get('whatField') == "horsepower"){
			theSet = {horsepower:req.get('fieldData')};
		}else if(req.get('whatField') == "def"){
			theSet = {def:req.get('fieldData')};
		}else if(req.get('whatField') == "axleRatio"){
			theSet = {axleRatio:req.get('fieldData')};
		}else if(req.get('whatField') == "status"){
			theSet = {status:parseInt(req.get('fieldData'))};
		}else if(req.get('whatField') == "type"){
			theSet = {type:parseInt(req.get('fieldData'))};
		}else if(req.get('whatField') == "locationStatus"){
			theSet = {locationStatus:parseInt(req.get('fieldData'))};
		}else if(req.get('whatField') == "location"){
			theSet = {location:{type:'Point', coordinates:[req.get('longitude'), req.get('latitude')]}};
		}else{
			sendError(req, res, 400, "whatField is invalid: " + req.get('whatField'), true);
			return;
		}
		itemsCollection.update({_id:ObjectId(req.get('id'))}, {$set:theSet, $push:{edits:{edit:theSet, whenSet:(new Date()).getTime(), editedByWho:req.user._id}}}, function(err,result){
			if(err)
				sendError(req, res, 400, "error on find method for: " + req.get('whatField') + " with info: " + req.get('fieldData'), false);
			else
				res.send(200, result);
			req.db.close();
			res.end();
		});
	}
}

exports.editHistory = function(req, res){
	var checkForRights = new Array();
	checkForRights.push('editHistory');
	for(right in checkForRights){
		if(!req.user.rights[right]){
			sendError(req, res, 401, 'insufficientRights', true);
			return;
		}
	}
	var itemsCollection = req.db.collection('items');
	itemsCollection.find(findParams,whichFields).toArray(function(err, items){
		if(err)
			sendError(req, res, 400, "error on find user method", false);
		else
			res.json(items);
		req.db.close();
		res.end();
	});
}

var itemsSimple = {

};

var itemsComplex = {
	edits:0
};

var allFields = {};

var editHistoryFields = {
	edits:1
};

exports.items = function(req, res){
	var whatTypeOfRequest;
	var findParams;
	var checkForRights = new Array();
	if(req.body.id != undefined && req.body.id != null && req.body.id != ''){
		whatTypeOfRequest = 'specific';
		findParams = {_id:ObjectId(req.body.id)};
	}else{
		whatTypeOfRequest = 'all';
		checkForRights.push('allItems');
		findParams = {companyId:req.user.companyId};
	}
	var whichFields;
	if(req.body.data != undefined && req.body.data != null && req.body.data != ''){
		if(req.body.data == 'location'){
			checkForRights.push('getLocation');
			whichFields = locationItemFields;
		}else if(req.body.data == 'simple'){
			checkForRights.push('itemsSimple');
			whichFields = simpleItemFields;
		}else if(req.body.data == 'complex'){
			checkForRights.push('itemsComplex');
			whichFields = complexItemFields;
		}else if(req.body.data == 'full'){
			checkForRights.push('itemsComplex');
			checkForRights.push('editHistory');
			whichFields = allFields;
		}else if(req.body.data == 'editHistory'){
			checkForRights.push('editHistory');
			whichFields = editHistoryFields;
		}
	}
	for(right in checkForRights){
		if(!req.user.rights[right]){
			sendError(req, res, 401, 'insufficientRights', true);
			return;
		}
	}
	var itemsCollection = req.db.collection('items');
	itemsCollection.find(findParams,whichFields).toArray(function(err, items){
		if(err)
			sendError(req, res, 400, "error on find item method", false);
		else
			res.json(items);
		req.db.close();
		res.end();
	});
}