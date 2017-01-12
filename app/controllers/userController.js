
var util = require('../util/util');
var http = require('http');
var crypto = require('crypto');
var stringHelper = require('../util/shared/stringHelper');
var authenticator = require('../authenticate/authenticator');
var wechat = require('../authenticate/wechat-auth');

var userRepository = require('../repositories/userRepository');
var userWechatRepository = require('../repositories/userWechatRepository');
var registrationRepository = require('../repositories/registrationRepository');
var mailService = require('../repositories/mailRepository');
var imageRepository = require('../repositories/imageRepository');

var q = require('q');

exports.loginByWechat = function(req,res){
	if (!util.checkParam(req.body,['code'])) {
		res.send(util.wrapBody('Invalid Parameter','E'));
	}else{
		var app = 'stars';

		if ('app' in req.body) {
			app = req.body.app;
		}

		var deferred = q.defer();

		var postData = JSON.stringify({
			code:req.body.code,
			app:app
		});
		//console.log('postData',postData);
		var options = {
			hostname: 'localhost',
			  	port: 5566,
			  	path: '/adapter/login/wechat',
			  	method: 'POST',
			  	headers: {
			  	  'Content-Type': 'application/json'
			  	}
		};

		var wechatRequest = http.request(options, function(res){
			res.setEncoding('utf8');
			
			res.on('data', function(chunk){
			  	var resJSON = JSON.parse(chunk);
			  	if (resJSON.status == 'E'){
			  		deferred.reject(new Error(resJSON.body));
			  	}else{
			  		deferred.resolve(resJSON.body);
			  	}
			  	
			});
			  
			res.on('end', function(){
			    //console.log('No more data in response.');
			});
		});

		wechatRequest.on('error', function(e){
		  	console.log('problem with request:',e.message);
		  	deferred.reject(e.message);
		});

		wechatRequest.write(postData);
		wechatRequest.end();

		deferred.promise.then(function findOrCreateUser(userInfo){

			//console.log('userInfo',userInfo);
			return userWechatRepository.findOne({
				unionId:userInfo.unionid
			}).then(function(oldWechatUser){

				if (!!oldWechatUser) {
					return userRepository.updateById(oldWechatUser.user,{
						lastLoginDate:new Date()
					});
				}else{
					var imageName = stringHelper.randomString(10,['lower','digit']);

					return imageRepository
					.getFromUrl(imageName,userInfo.headimgurl)
					.then(function(path){
						return imageRepository.putToOSS(imageName,path);
					}).then(function createUser(res){
						var newUser = {
							nickname:userInfo.nickname,
							password:'',
							gender:userInfo.sex,
							headImgUrl:res.url
						};

						return userRepository.create(newUser);
						
					}).then(function createUserWechat(newUser){
						user = newUser;

						var newUserWechat = {
							user:newUser._id,
							nickname:userInfo.nickname,
							sex:userInfo.sex,
							city:userInfo.city,
							country:userInfo.country,
							headImgUrl:newUser.headImgUrl,
							openId:userInfo.openid,
							unionId:userInfo.unionid
						};

						return userWechatRepository.create(newUserWechat);
					});
				}
			});
		}).then(function createToken(){
			return authenticator.create(user._id);
		}).then(function sendResponse(token){
			res.setHeader('set-token',token);

			var responseBody = {
				token:token,
				user:user
			};

			res.send(util.wrapBody(responseBody));
		}).fail(function(err){
			console.log(err);
			res.send(util.wrapBody('Internal Error','E'));
		});
	}
};

exports.getUserProfile = function(req,res){
	var userId = req.params.id;

	userRepository.findById(userId).then(function(user){
		res.send(util.wrapBody({user:user}));
	}).fail(function(err){
		console.log(err);
		res.send(util.wrapBody('Internal Error','E'));
	});
};

exports.loginByEmail = function(req,res){

	if(util.checkParam(req.body,['email','password'])){
		var email = req.body.email;
		var password = req.body.password;
		var user = null;

		userRepository.update({
			email:email,
			password:encryptPassword(password)
		},{
			latestLoginDate:new Date()
		}).then(function createToken(newUser){
			if (!newUser) {
				return null;
			}else{
				user = newUser;
				return authenticator.create(newUser._id);
			}

		}).then(function sendResponse(token){
			res.setHeader('set-token',token);
			var responseBody = {
				token:token,
				user:user
			};
			res.send(util.wrapBody(responseBody));
		}).fail(function(err){
			console.log(err);
			res.send(util.wrapBody('Internal Error','E'));
		});
	}else{
		res.send(util.wrapBody('Invalid Parameter','E'));
	}
};

exports.create = function(req,res){
	if (!util.checkParam(req.body,['email','password'])) {
		res.send(util.wrapBody('Invalid Parameter','E'));
	}else{
		var email = req.body.email;
		var password = req.body.password;
		var latestUser = null;

		userRepository.count({
			email:email
		}).then(function createUser(exist){
			if (exist > 0) {
				throw new Error('Email exist');
			}else{
				var user = {
					email:email,
					password:encryptPassword(password)
				};

				return userRepository.create(user);
			}
		}).then(function createRegistration(user){
			latestUser = user;
			var registration = {
				user:user._id,
				activateCode:stringHelper.randomString(4,['lower','digit'])
			};

			return registrationRepository.create(registration);
		}).then(function sendEmail(registration){
			var deferred = q.defer();

			mailService.sendActivateCode(email,registration.activateCode,function(err){
				if (err) {
					deferred.reject(err);
				}else{
					deferred.resolve(registration);
				}
			});

			return deferred.promise;
		}).then(function createToken(){
			return authenticator.create(latestUser._id);
		}).then(function sendResponse(token){
			res.setHeader('set-token',token);
			delete latestUser.password;
			res.send(util.wrapBody({user:latestUser}));
		}).fail(function(err){
			console.log(err);
			res.send(util.wrapBody('Internal Error','E'));
		});
	}
};


exports.checkEmailActivated = function(req,res){
	var userId = req.token.userId;

	registrationRepository.findOne({
		user:userId
	}).then(function(registration){
		res.send(util.wrapBody({
			isActivated:registration.isActivated
		}));
	}).fail(function(err){
		console.log(err);
		res.send(util.wrapBody('Internal Error','E'));
	});
};

exports.activateEmail = function(req,res){
	if (!util.checkParam(req.body,['activateCode'])) {
		res.send(util.wrapBody('Invalid Parameter','E'));
	}else{
		var activateCode = req.body.activateCode;
		var userId = req.token.userId;

		registrationRepository.update({
			user:userId,
			activateCode:activateCode
		},{
			isActivated:true
		}).then(function(registration){
			if (!!registration&&registration.isActivated) {
				res.send(util.wrapBody({success:true}));
			}else{
				res.send(util.wrapBody({success:false}));	
			}
		}).fail(function(err){
			console.log(err);
			res.send(util.wrapBody('Internal Error','E'));
		});
	}

};

exports.update = function(req,res){

	var updates = req.body;
	var userId = req.token.userId;

	var latestRegistration = null;
	var latestUser = null;

	registrationRepository.findOne({
		user:userId
	}).then(function updateUser(registration){
		if (!!registration&&registration.isActivated) {
			if ('createdDate' in updates) delete updates.createdDate;
			if ('email' in updates) delete updates.email;
			if ('password' in updates) delete updates.password;
			if ('wechatOpenId' in updates) delete updates.wechatOpenId;
			if ('wechatUnionId' in updates) delete updates.wechatUnionId;

			return user.updateById(userId,updates);
		}else{
			res.send(util.wrapBody('Not activated','E'));
		}
	}).then(function sendResponse(user){
		res.send(util.wrapBody({user:user}));
	}).fail(function(err){
		console.log(err);
		res.send(util.wrapBody('Internal Error','E'));
	});
};

exports.updatePassword = function(req,res){
	var userId = req.token.userId;
	

	if (util.checkParam(req.body,['oldPassword','newPassword'])) {
		res.send(util.wrapBody('Invalid Parameter','E'));
	}else{
		var oldPassword = req.body.oldPassword;
		var newPassword = req.body.newPassword;

		userRepository.update({
			_id:userId,
			password:encryptPassword(oldPassword)
		},{
			password:encryptPassword(newPassword)
		}).then(function(user){
			if (!!user) {
				res.send(util.wrapBody({user:user}));
			}else{
				res.send(util.wrapBody({user:null}));
			}
		}).fail(function(err){
			console.log(err);
			res.send(util.wrapBody('Internal Error','E'));
		});
	}

};

exports.resetPassword = function(req,res){
	if (!util.checkParam(req.body,['email'])) {
		res.send(util.wrapBody('Invalid Parameter','E'));
	}else{
		var email = req.body.email;
		var tempPassword = stringHelper.randomString(6,'all');

		userRepository.update({
			email:email
		},{
			password:encryptPassword(tempPassword)
		}).then(function sendEmail(user){
			var deferred = q.defer();
			mailService.sendTempPassword(latestUser.email,tempPassword,function(err){
				if (err) {
					deferred.reject(err);
				}else{
					deferred.resolve(user);
				}
			});

			return deferred.promise;
		}).then(function(user){
			res.send(util.wrapBody({success:true}));
		}).fail(function(err){
			console.log(err);
			res.send(util.wrapBody('Internal Error','E'));
		});
	}
				
};

function encryptPassword(rawPassword){

	var sha1 = crypto.createHash('sha1');

	sha1.update(rawPassword);

	return sha1.digest('hex');
}

