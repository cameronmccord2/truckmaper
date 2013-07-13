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

var newItemObject = {
	name:'',
	location: new Array()
};

var newLocationObject = function(typeOfLocation, longitude, latitude, who){
	return {loc:{type:typeOfLocation, coordinates:[longitude, latitude], who:who, when:(new Date()).getTime()}};
}

var newItemHistoryEntryObject = function(who, how, typeOfAccess){
	return {who:who, how:how, typeOfAccess:typeOfAccess, when:(new Date()).getTime()};
}

var newItemObject = function(attributes, locationCode, area, location, historyEntry){
	return {attributes:attributes, locationCode:locationCode, area:area, location:[location], history:[historyEntry]};
}

var newAttributeObject = function(key, value){
	return {key:key, value:value};
}

var checkForInvalidFields = function(object, field){
	if(object[field] == undefined || object[field] == null)
		return true;
	else
		return false;
}

var accessType = {
	create:100,
	editDetails:200,
	updateLocation:300,
	delete:400
};

var companyToAreaFields = {
	name:1
};

var sendError = function(req, res, status, message, closeAndEnd, consoleLogSpecific){
	console.log(consoleLogSpecific || message);
	res.send(status, message);
	if(closeAndEnd){
		req.db.close();
		res.end();
	}
}

exports.newItem = function(req, res){
	//uses: req.body.attributes.*, req.body.locationCode, req.body.longitude, req.body.latitude, req.user.*, req.body.deviceType
	if(!req.user.rights.newItem)// lets not do right right now
		sendError(req, res, 401, 'insufficientRights', true);
	else{
		// do an area check here
		// if(req.body.area == undefined || req.body.area == null || req.body.area == '')
		// 	var companiesCollection = req.db.collection('companies');
		// 	companiesCollection.find({}, companyToAreaFields, function(err, companies){
		// 		if(err){
		// 			sendError(req, res, 400, "error on find method for area with lat: " + req.body.latitude + " and long: " + req.body.longitude, true);
		// 			return;
		// 		}
		// 		var area = companies;
		// 	});
		// }else{
		// 	// area provided
		// }
		if(checkForInvalidFields(req.body, 'attributes'))
			sendError(req, res, 400, "Mising token: attributes");
		else if(checkForInvalidFields(req.body, 'locationCode'))
			sendError(req, res, 400, "Mising token: locationCode");
		else if(checkForInvalidFields(req.body, 'longitude'))
			sendError(req, res, 400, "Mising token: longitude");
		else if(checkForInvalidFields(req.body, 'latitude'))
			sendError(req, res, 400, "Mising token: latitude");
		else if(checkForInvalidFields(req.body, 'deviceType'))
			sendError(req, res, 400, "Mising token: deviceType");
		else if(checkForInvalidFields(req, 'user'))
			sendError(req, res, 400, "Mising user, fix that");
		else{
			var attributeArray = new Array();
			for (var i = req.body.attributes.length - 1; i >= 0; i--) {
				if(req.body.attributes[i].key == undefined || req.body.attributes[i].key == null || req.body.attributes[i].key == '' || req.body.attributes[i].value == undefined || req.body.attributes[i].value == null || req.body.attributes[i].value == '')
					console.log('null attribute or key found', req.body.attributes[i]);
				else
					attributeArray.push(newAttributeObject(req.body.attributes[i].key, req.body.attributes[i].value));
			};	
			var newItem = newItemObject(attributeArray, req.body.locationCode, "no area yet", newLocationObject("Point", req.body.longitude, req.body.latitude, req.user._id), newItemHistoryEntryObject(req.user._id, req.body.deviceType, accessType.create));
			var itemCollection = req.db.collection('items');
			itemsCollection.insert(newItem, function(err, result){
				if(err)
					sendError(req, res, 500, "error on insert new item method", false);
				else
					res.json(200, newItem);
				req.db.close();
				res.end();
			});
		}
	}
}

exports.editItem = function(req, res){// set up for different types of edits: location, nonLocation
	if(!req.user.rights.editItem)
		sendError(req, res, 401, 'insufficientRights', true);
	else{
		if(checkForInvalidFields(req.query, 'typeOfEdit')){
			sendError(req, res, 400, "Missing token: typeOfEdit", true);
			return;
		}
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

// exports.editHistory = function(req, res){
// 	var checkForRights = new Array();
// 	checkForRights.push('editHistory');
// 	for(right in checkForRights)
// 		if(!req.user.rights[right]){
// 			sendError(req, res, 401, 'insufficientRights', true);
// 			return;
// 		}
// 	if(checkForInvalidFields(req.query, 'itemId'))
// 		sendError(req, res, 400, 'Missing token: itemId', true);
// 	else{
// 		var itemsCollection = req.db.collection('items');
// 		itemsCollection.find({_id:ObjectId(req.query.itemId.toString())}, whichFields).toArray(function(err, items){
// 			if(err)
// 				sendError(req, res, 400, "error on find user method", false);
// 			else
// 				res.json(items);
// 			req.db.close();
// 			res.end();
// 		});
// 	}
// }

var itemsSimple = {

};

var itemsComplex = {
	edits:0
};

var allFields = {};// update this one to not give entire history

var allAndHistoryFields = {};

var editHistoryFields = {
	edits:1
};

exports.items = function(req, res){
	var whatTypeOfRequest;
	var findParams;
	var checkForRights = new Array();
	if(req.query.id != undefined && req.query.id != null && req.query.id != ''){
		whatTypeOfRequest = 'specific';
		findParams = {_id:ObjectId(req.query.id.toString())};
	}else{
		whatTypeOfRequest = 'all';
		checkForRights.push('allItems');
		//findParams = {companyId:req.user.companyId.toString()};
		findParams = {};
	}
	var whichFields;
	if(req.query.data != undefined && req.query.data != null && req.query.data != ''){
		if(req.query.data == 'location'){
			checkForRights.push('getLocation');
			whichFields = locationItemFields;
		}else if(req.query.data == 'simple'){
			checkForRights.push('itemsSimple');
			whichFields = simpleItemFields;
		}else if(req.query.data == 'allAndHistory'){
			checkForRights.push('allAndHistory');
			whichFields = allAndHistoryFields;
		}else if(req.query.data == 'all'){
			checkForRights.push('all');
			whichFields = allFields;
		}else if(req.query.data == 'complex'){
			checkForRights.push('itemsComplex');
			whichFields = complexItemFields;
		}else if(req.query.data == 'full'){
			checkForRights.push('itemsComplex');
			checkForRights.push('editHistory');
			whichFields = allFields;
		}else if(req.query.data == 'editHistory'){
			checkForRights.push('editHistory');
			whichFields = editHistoryFields;
		}
	}
	// for(right in checkForRights){
	// 	if(!req.user.rights[right]){
	// 		sendError(req, res, 401, 'insufficientRights', true);
	// 		return;
	// 	}
	// }
	var itemsCollection = req.db.collection('items');
	itemsCollection.find(findParams, whichFields).toArray(function(err, items){
		if(err)
			sendError(req, res, 400, "error on find item method", false);
		else
			res.json(items);
		req.db.close();
		res.end();
	});
}
























