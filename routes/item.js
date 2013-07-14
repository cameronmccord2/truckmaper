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

var newItemObjectAttributes = function(){
	return {
		location: new Array(),
		attributes: new Array(),
		history: new Array(),
		code: new Array()
	}
};

var newCodeObject = function(code, howSet){
	return {code:code, howSet:howSet, whenSet:(new Date()).getTime()};
}

var newLocationObject = function(typeOfLocation, longitude, latitude, who){
	return {loc:{type:typeOfLocation, coordinates:[longitude, latitude], who:who, when:(new Date()).getTime()}};
}

var newItemHistoryEntryObject = function(who, how, typeOfAccess){
	return {who:who, how:how, typeOfAccess:typeOfAccess, when:(new Date()).getTime()};
}

var newItemObject = function(code, attributes, location, history){
	var item = newItemObjectAttributes();
	item.code.push(code);
	item.attributes.push(attributes);
	item.location.push(location);
	item.history.push(history);
	return item;
}

var newAttributeObject = function(key, value){
	return {key:key, value:value};
}

var newAttributeArray = function(attributes){
	var attributeArray = new Array();
	for (var i = attributes.length - 1; i >= 0; i--) {
		if(attributes[i].key == undefined || attributes[i].key == null || attributes[i].key == ''){
			sendError(req, res, 400, 'Invalid attribute key found', true);
			return 'error';
		}else if(attributes[i].value == undefined || attributes[i].value == null){
			sendError(req, res, 400, 'Invalid attribute value found for key: ' + attributes[i].key, true);
			return 'error';
		}else
			attributeArray.push(newAttributeObject(req.body.attributes[i].key, req.body.attributes[i].value));
	};
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
	//uses: req.body.attributes.*, req.body.code, req.body.locationCode, req.body.longitude, req.body.latitude, req.user.*, req.body.deviceType
	if(!req.user.rights.newItem)// lets not do right right now
		sendError(req, res, 401, 'insufficientRights', true);
	else{
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
			sendError(req, res, 500, "Mising user, fix that");
		else if(checkForInvalidFields(req.body, 'code'))
			sendError(req, res, 400, "Missing token: code");
		else if(checkForInvalidFields(req.body, 'howSet'))
			sendError(req, res, 400, "Missing token: howSet");
		else if(checkForInvalidFields(req, 'user'))
			sendError(req, res, 500, "Missing req.user, fix that");
		else if(checkForInvalidFields(req.user, '_id'))
			sendError(req, res, 500, "Missing req.user._id, fix that");
		else{
			var attributeArray = newAttributeArray(req.body.attributes);
			if(attributeArray == 'error')
				return;
			// this needs to be checked
			var newItem = newItemObject(newCodeObject(req.body.code, req.body.howSet), attributeArray, newLocationObject("Point", req.body.longitude, req.body.latitude, req.user._id), newItemHistoryEntryObject(req.user._id, req.body.deviceType, accessType.create));
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

var editTypes = {
	location:{

	},
	nonLocation:{

	}
};

exports.editItem = function(req, res){// set up for different types of edits: location, nonLocation
	if(!req.user.rights.editItem)
		sendError(req, res, 401, 'insufficientRights', true);
	else{
		if(checkForInvalidFields(req.query, 'typeOfEdit')){
			sendError(req, res, 400, "Missing token: typeOfEdit", true);
			return;
		}else{
			var thePush = new Object();
			if(checkForInvalidFields(req, 'user')){
				sendError(req, res, 500, "Missing req.user, fix that", true);
				return;
			}else if(checkForInvalidFields(req.user, '_id')){
				sendError(req, res, 500, "Missing req.user._id, fix that", true);
				return;
			}else if(checkForInvalidFields(req.body, 'deviceType')){
				sendError(req, res, 500, "Missing req.body.deviceType", true);
				return;
			}else
				thePush.history = newItemHistoryEntryObject(req.user._id, req.body.deviceType, accessType.create);

			
			if(req.query.typeOfEdit == 'location'){
				if(checkForInvalidFields(req.body, 'longitude')){
					sendError(req, res, 400, "Missing token: longitude", true);
					return;
				}else if(checkForInvalidFields(req.body, 'latitude')){
					sendError(req, res, 400, "Missing token: latitude", true);
					return;
				}else
					thePush.location = newLocationObject('Point', req.body.longitude, req.body.latitude, req.user._id);
			}else if(req.query.typeOfEdit == 'nonLocation'){
				if(checkForInvalidFields(req.body, 'attributes')){
					sendError(req, res, 400, "Missing token: attributes", true);
					return;
				}else{
					var attributeArray = newAttributeArray(req.body.attributes);
					if(attributeArray == 'error')
						return;
					thePush.attributes = attributeArray;
				}
			}else if(req.query.typeOfEdit == 'code'){
				if(checkForInvalidFields(req.body, 'code')){
					sendError(req, res, 400, "Missing token: code", true);
					return;
				}else if(checkForInvalidFields(req.body, 'howSet')){
					sendError(req, res, 400, "Missing token: howSet", true);
					return;
				}else
					thePush.code = newCodeObject(req.body.code, req.body.howSet);
			}else{
				sendError(req, res, 400, "Invalid edit type", true);
				return;
			}
			console.log(thePush);
			if(checkForInvalidFields(req.query, 'itemId')){
				sendError(req, res, 400, "Missing token: itemId", true);
				return;
			}else{
				var itemsCollection = req.db.collection('items');
				itemsCollection.update({_id:ObjectId(req.query.itemId.toString())}, {$push:thePush}, function(err,result){
					if(err)
						sendError(req, res, 500, "error on update method for: " + req.body.typeOfEdit, true);
					else{
						itemsCollection.find({_id:ObjectId(req.query.itemId.toString())}, allFields).toArray(function(err, items){
							if(err)
								sendError(req, res, 500, "error on find item method after update", false);
							else{
								if(items.length == 0)
									sendError(req, res, 500, "Cant find item by _id that was just inserted", false);
								else if(items.length != 1)
									sendError(req, res, 500, items.length + " items were returned for a find item by _id method", false);
								else
									res.json(200, items[0]);
								req.db.close();
								res.end();
							}
						});
					}
				});
			}
		}
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

var historyFields = {
	edits:1
};

exports.items = function(req, res){// adapt this for the 'all' call to not crash the machine becuase of ram use
	var whatTypeOfRequest;
	var findParams;
	var checkForRights = new Array();
	if(checkForInvalidFields(req.query, 'type')){
		sendError(req, res, 400, "Missing token: type", true);
		return;
	}
	if(req.query.type == "byId"){
		if(!checkForInvalidFields(req.query, 'itemId')){
			sendError(req, res, 400, "Missing token: itemId");
			return;
		}else
			findParams = {_id:ObjectId(req.query.itemId.toString())};
	}else if(req.query.type == "byCode"){
		if(!checkForInvalidFields(req.query, 'code')){
			sendError(req, res, 400, "Missing token: code");
			return;
		}else
			findParams = {code:req.query.code};// make sure pulling by code is working, currently it is not**************************
	}else if(req.query.type == "all"){
		checkForRights.push('allItems');
		findParams = {};
	}else{
		sendError(req, res, 400, "Invalid type: " + req.query.type, true);
		return;
	}
	if(checkForInvalidFields(req.query, 'whichFields')){
		sendError(req, res, 400, "Missing token: whichFields", true);
		return;
	}

	var whichFields;
	if(req.query.whichFields == 'location'){
		checkForRights.push('getLocation');
		whichFields = locationItemFields;
	}else if(req.query.whichFields == 'allAndHistory'){
		checkForRights.push('all');
		checkForRights.push('history');
		whichFields = allAndHistoryFields;
	}else if(req.query.whichFields == 'all'){
		checkForRights.push('all');
		whichFields = allFields;
	}else if(req.query.whichFields == 'history'){
		checkForRights.push('history');
		whichFields = historyFields;
	}else{
		sendError(req, res, 400, "Invalid whichFields: " + req.query.whichFields, true);
		return;
	}
	// for(right in checkForRights){
	// 	if(!req.user.rights[right]){
	// 		sendError(req, res, 401, 'insufficientRights', true);
	// 		return;
	// 	}
	// }
	var itemsCollection = req.db.collection('items');
	// check after this, not checked yet
	itemsCollection.find(findParams, whichFields).toArray(function(err, items){
		if(err)
			sendError(req, res, 500, "error on find item method", false);
		else
			res.json(items);
		req.db.close();
		res.end();
	});
}
























