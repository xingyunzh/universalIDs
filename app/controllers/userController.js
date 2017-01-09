
var util = require('../util/util');
var crypto = require('crypto');
var stringHelper = require('../util/shared/stringHelper');
var authenticator = require('../authenticate/authenticator');
var wechat = require('../authenticate/wechat-auth');

var userRepository = require('../repositories/userRepository');
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

		var code = req.body.code;
		var wechatAuthClient = null;
		var user = null;
		wechat.getClientByApp(app).then(function(client){
			wechatAuthClient = client;
			
			var deferred = q.defer();

			wechat.getAccessToken(client,code,function(err,at,oi){
				
				if (err) {
					deferred.reject(err);
				}else{
					deferred.resolve(oi);
				}

			});

			return deferred.promise;
		}).then(function getWechatInfo(openId){
			var d = q.defer();

			wechat.getUserInfo(wechatAuthClient,openId,function(err,userInfo){
				if (err) {
					d.reject(err);
				}else{
					d.resolve(userInfo);
				}
			});

			return d.promise;
		}).then(function findOrCreateUser(userInfo){
			console.log('userInfo',userInfo);
			return userRepository.findOne({
				wechatUnionId:userInfo.unionid
			}).then(function(oldUser){
				console.log('oldUser',oldUser);
				if (!!oldUser) {
					return userRepository.updateById(oldUser._id,{
						lastLoginDate:new Date()
					});
				}else{
					var imageName = stringHelper.randomString(10,['lower','digit']);

					return imageRepository
					.getFromUrl(imageName,userInfo.headimgurl)
					.then(function(path){
						return imageRepository.putToOSS(imageName,path);
					}).then(function(res){
						var newUser = {
							nickname:userInfo.nickname,
							password:'',
							gender:userInfo.sex,
							city:userInfo.city,
							country:userInfo.country,
							headImgUrl:res.url,
							wechatOpenId:userInfo.openid,
							wechatUnionId:userInfo.unionid
						};

						return userRepository.create(newUser);
						
					});
				}
			});
		}).then(function createToken(newUser){
			user = newUser;
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

