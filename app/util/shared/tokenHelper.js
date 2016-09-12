
var jwt = require('jsonwebtoken');

var XINGYUNZH_UNIVERSAL_SECRET = "xingyunzh-universal-secret";

module.exports.verify = function(tokenString,callback){
	jwt.verify(tokenString,XINGYUNZH_UNIVERSAL_SECRET,callback);
}

module.exports.create = function(userId,callback){
	console.log('userId',userId);
	
	jwt.sign({
		userId:userId
	},XINGYUNZH_UNIVERSAL_SECRET,{
		expiresIn:3600
	},callback);
}