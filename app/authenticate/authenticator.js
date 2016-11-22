var jwt = require('jsonwebtoken');
var q = require('q');
var scr = require('../repositories/systemConfigRepository');

var secret = null;

function getSecret(){
	if (secret) {
		return secret;
	}else{
		secret = scr.getTokenSecret().secret;
		return secret;
	}

}

module.exports.verify = function(tokenString){
	var deferred = q.defer();

	jwt.verify(tokenString,secret,function(err,tokenObject){
		if (err) {
			deferred.reject(err);
		}else{
			deferred.resolve(tokenObject);
		}
	});

	return deferred.promise;
};

module.exports.create = function(userId){
	return generate(userId);
};

function generate(id){
	var deferred = q.defer();

	jwt.sign({
		userId:id
	},getSecret(),{
		expiresIn:60 * 60 * 24
	},function(err,token){
		if (err) {
			deferred.reject(err);
		}else{
			deferred.resolve(token);
		}
	});

	return deferred.promise;
}

module.exports.authenticate = function(req, res, next) {

	var tokenString = req.get('x-access-token');

	if (!tokenString) {
		res.send(util.wrapBody('Invalid token','E'));
	}else{
		jwt.verify(tokenString).then(function(tokenObject){
			req.token = tokenObject;

			if (tokenObject.exp - Math.floor(Date.now() / 1000) < 6 * 60 * 60) {
				generate(tokenObject.userId).then(function(newTokenString){
					res.setHeader('set-token',newTokenString);
					next();
				}).fail(function(err){
					console.log(err);
					res.send(util.wrapBody('Internal Error','E'));
				});
			}else{
				next();
			}
		}).fail(function(err){
			console.log(err);
			res.send(util.wrapBody('Invalid token','E'));
		});
	}
};