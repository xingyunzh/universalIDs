var wechat = require('../util/wechat-auth.js');
var util = require('../util/shared/util.js');
var crypto = require('crypto');
var stringHelper = require('../util/shared/stringHelper.js');
var tokenHelper = require('../util/shared/tokenHelper.js');

var userModel = require('../models/user');
var userWechatModel = require('../models/user-wechat');
var fullProfile = require('../models/full-profile');
var registrationModel = require('../models/registration');

var mailService = require('./services/mail-service.js');


exports.testingMail = function(req,res){
	mailService.sendTestingMail(function(err,result){
		if(err){
	        console.log(err);
	    }else{
	        console.log('Message sent: ' + result.response);
	    }
	    res.send("OK");
	});
}

exports.loginByWechat = function(req,res){

	//States declaration
	const STATE_GET_WECHAT_TOKEN = 1;
	const STATE_GET_USER_INFO = 2;
	const STATE_CHECK_USER_EXIST = 3;
	const STATE_UPDATE_USER_WECHAT = 4;
	const STATE_UPDATE_USER = 5;
	const STATE_CREATE_USER = 6;
	const STATE_CREATE_USER_WECHAT = 7;
	const STATE_CREATE_TOKEN = 8;
	const STATE_SEND_RESPONSE = 0;

	var code = req.body.code;
	var accessToken = null;
	var openId = null;
	var userInfo = null;
	var latestUserWechat = null;
	var jwToken = null;
	var latestUser = null;

	stateMachine(null,STATE_GET_TOKEN);

	function stateMachine(err,toState){
		console.log('state:',toState);

		if (err) {
			
			console.log('error:',err);
			res.send(util.wrapBody('Internal Error','E'));
		}else{

			switch(toState){
				case STATE_GET_WECAHAT_TOKEN: 
					//get accessToken&openID by code
					wechat.getAccessToken(code,function(err,at,oi){
						accessToken = at;
						openId = oi;
						stateMachine(err,STATE_GET_USER_INFO);
					});
				break;
				case STATE_GET_USER_INFO:
					//get user info from wechat
					wechat.getUserInfo(accessToken,function(err,ui){
						console.log('wechat info',ui);
						userInfo = ui;
						stateMachine(err,STATE_CHECK_USER_EXIST);
					});
				break;
				case STATE_CHECK_USER_EXIST:

					userWechatModel
					.findOne({unionID:userInfo.unionID})
					//.populate('user')
					.exec(function(err,result){
						if(result == null){
							stateMachine(err,STATE_CREATE_USER);
						}else{
							latestUserWechat = result;
							stateMachine(err,STATE_UPDATE_USER_WECHAT);
						}
					});
				break;
				case STATE_UPDATE_USER_WECHAT:
					//if the user-wechat exist
					userWechatModel
					.findOneAndUpdate({
						user:latestUserWechat.user
					},userInfo,{
						new:true
					})
					//.populate('user')
					.exec(function(err,luw){
						latestUserWechat = luw;
						stateMachine(err,STATE_UPDATE_USER);
					});
				break;
				case STATE_UPDATE_USER:
					userModel
					.findOneAndUpdate({
						_id:latestUserWechat.user
					},{
						lastLoginDate:new Date()
					},{
						new:true
					},function(err,lu){
						latestUser = lu;
						stateMachine(err,STATE_CREATE_TOKEN);
					})
				break;
				case STATE_CREATE_USER:
					//if the user-wechat does not exist,create user
					var newUser = new userModel();
					newUser.nickname = userInfo.nickname;
					newUser.password = encryptPassword(stringHelper.randomString(6,all));
					//newUser.createdDate = new Date();
					newUser.lastLoginDate = new Date();

					newUser
					.save(function(err,result){
						latestUser = result;
						stateMachine(err,STATE_CREATE_USER_WECHAT);
					});
				break;
				case STATE_CREATE_USER_WECHAT:

					var newUserWechat = new userWechatModel();
					newUserWechat.user = latestUser._id;
					newUserWechat.nickname = userInfo.nickname;
					newUserWechat.sex = userInfo.sex;
					newUserWechat.province = userInfo.province;
					newUserWechat.city = userInfo.city;
					newUserWechat.country = userInfo.country;
					newUserWechat.privilege = userInfo.privilege;
					newUserWechat.unionID = userInfo.unionID;

					newUserWechat
					.save(function(err,luw){
						latestUserWechat = luw;
						stateMachine(err,STATE_CREATE_TOKEN);
					});

				break;
				case STATE_CREATE_TOKEN:
					tokenHelper.create(latestUser._id,function(err,jt){
						jwToken = jt;
						stateMachine(err,STATE_SEND_RESPONSE);
					})

				break;
				case STATE_SEND_RESPONSE:
					var result = {authenticated:true,token:jwToken,nickname:latestUser.nickname};

					res.send(util.wrapBody(result));
				break;
				default: res.send(util.wrapBody('Internal Error','E'));
			}
		}
	}

};

exports.getUserProfile = function(req,res){

	const STATE_GET_USER_PROFILE = 2;
	const STATE_GET_WECHAT_PROFILE = 3;
	const STATE_BUILD_FULL_PROFILE = 4;
	const STATE_SEND_RESPONSE = 0;

	var tokenObject = req.token;
	var latestUser = null;
	var latestUserWechat = null;
	var latestFullProfile = null;

	stateMachine(null,STATE_GET_USER_PROFILE);


	function stateMachine(err,toState){
		console.log('state:',toState);

		if (err) {
			
			console.log('error:',err);
			res.send(util.wrapBody('Internal Error','E'));

		}else{

			switch(toState){
				case STATE_GET_USER_PROFILE:

					userModel
					.findById(tokenObject.userId)
					.exec(function(err,lu){
						latestUser = lu;
						console.log('lu',lu);
						stateMachine(err,STATE_GET_WECHAT_PROFILE);
					});
				break;
				case STATE_GET_WECHAT_PROFILE:

					userWechatModel
					.findOne({user:tokenObject.userId})
					.exec(function(err,luw){
						latestUserWechat = luw;
						stateMachine(err,STATE_BUILD_FULL_PROFILE);
					});
				break;
				case STATE_BUILD_FULL_PROFILE:
					latestFullProfile = new fullProfile(latestUser,latestUserWechat);
					stateMachine(null,STATE_SEND_RESPONSE);
				break;
				case STATE_SEND_RESPONSE:
					res.send(util.wrapBody({profile:latestFullProfile}));
				break;
				default: 
					console.log('Invalid State');
					res.send(util.wrapBody('Internal Error','E'));
			}
		}
	}

};

exports.loginByEmail = function(req,res){
	var email = req.body.email;
	var password = req.body.password;

	const STATE_VERIFY_USER = 1;
	const STATE_CREATE_TOKEN = 2;
	const STATE_SEND_RESPONSE = 0;

	var latestUser = null;
	var authenticated = false;
	var jwToken = null;

	stateMachine(null,STATE_VERIFY_USER);

	function stateMachine(err,toState){

		if (err) {
			console.log('state:',toState);
			console.log('error:',err);
			res.send(util.wrapBody('Internal Error','E'));
		} else {
			switch(toState){
				case STATE_VERIFY_USER:

					userModel
					.findOneAndUpdate({
						email:email,
						password:encryptPassword(password)
					},{
						latestLoginDate:new Date()
					},{
						new:true
					}).exec(function(err,lu){
						latestUser = lu;
						stateMachine(err,STATE_CREATE_TOKEN);
					})
				break;
				case STATE_CREATE_TOKEN:
					if (latestUser == null) {
						stateMachine(null,STATE_SEND_RESPONSE);
					}else{
						tokenHelper.create(latestUser._id,function(err,jt){
								jwToken = jt;
								authenticated = true;
								stateMachine(err,STATE_SEND_RESPONSE);
						})
					}
				break;
				case STATE_SEND_RESPONSE:
					var response = {};
					if (authenticated) {
						res.send(util.wrapBody({
							authenticated:true,
							token:jwToken,
							nickname:latestUser.nickname
						}));
					}else{
						res.send(util.wrapBody({authenticated:false,nickname:latestUser.nickname}));
					}
					
				break;
				default:
					console.log('Invalid State');
					res.send(util.wrapBody('Internal Error','E'));
			}
		}
	}

}

exports.createUser = function(req,res){
	console.log('inside createUser',req.body);

	var email = req.body.email;
	var password = req.body.password;

	const STATE_CHECK_USER_EXIST = 1;
	const STATE_CREATE_USER = 2;
	const STATE_CREATE_REGISTRATION = 3;
	const STATE_SEND_RESPONSE = 0;

	var latestUser = null;
	var isUserExist = 0;
	var latestRegistration = null;
	var jwToken = null;

	stateMachine(null,STATE_CHECK_USER_EXIST);

	function stateMachine(err,toState){
		console.log('current state:',toState);

		if (err) {
			console.log('state:',toState);
			console.log('error:',err);
			res.send(util.wrapBody('Internal Error','E'));
		} else {
			switch(toState){
				case STATE_CHECK_USER_EXIST:

					userModel
					.findOne({email:email})
					.count()
					.exec(function(err,result){
						isUserExist = result;
						stateMachine(err,STATE_CREATE_USER);
					})
				break;
				case STATE_CREATE_USER:
					if (isUserExist > 0) {
						stateMachine(null,STATE_SEND_RESPONSE);
					}else{

						console.log('password',password);

						var newUser = new userModel();
						newUser.email = email;
						newUser.password = encryptPassword(password);

						newUser
						.save(function(err,lu){
							latestUser = lu;
							stateMachine(err,STATE_CREATE_REGISTRATION);
						});
					}

				break;
				case STATE_CREATE_REGISTRATION:
					var newRegistration = new registrationModel();
					newRegistration.user = latestUser._id;
					newRegistration.activateCode = stringHelper.randomString(4,['lower','digit']);

					newRegistration
					.save(function(err,lr){
						latestRegistration = lr;
						stateMachine(err,STATE_SEND_RESPONSE);
					});
				break;
				case STATE_SEND_RESPONSE:
					if (isUserExist > 0) {
						res.send(util.wrapBody('Email is used','E'));
					}else{
						res.send(util.wrapBody({activateCode:latestRegistration.activateCode}));
					}
				break;
				default:
					console.log('Invalid State');
					res.send(util.wrapBody('Internal Error','E'));
			}
		}
	}
}

exports.checkEmailActivated = function(req,res){

	const STATE_CHECK_ACTIVATED = 1;
	const STATE_SEND_RESPONSE = 0;

	var tokenObject = req.token;
	var latestRegistration = null;

	stateMachine(null,STATE_CHECK_ACTIVATED);

	function stateMachine(err,toState){
		console.log('state',toState);

		if (err) {
			res.send(util.wrapBody('Internal Error','E'));

		}else{
			switch(toState){
				case STATE_CHECK_ACTIVATED:
					registrationModel
					.findOne({user:tokenObject.userId})
					.exec(function(err,lr){
						latestRegistration = lr;
						stateMachine(err,STATE_SEND_RESPONSE);
					})
				break;
				case STATE_SEND_RESPONSE:
					res.send(util.wrapBody({isActivated:latestRegistration.isActivated}));
				break;
				default:
					console.log('Invalid State');
					res.send(util.wrapBody('Internal Error','E'));
			}
		}
	}
}

exports.activateEmail = function(req,res){
	var activateCode = req.body.activateCode;

	const STATE_ACTIVATE_USER = 1;
	const STATE_SEND_RESPONSE = 0;

	var tokenObject = req.token;
	var latestRegistration = null;

	stateMachine(null,STATE_ACTIVATE_USER);

	function stateMachine(err,toState){
		console.log('state',toState);

		if (err) {
			console.log('error:',err);
			res.send(util.wrapBody('Internal Error','E'));

		}else{
			switch(toState){
				case STATE_ACTIVATE_USER:
					registrationModel
					.findOneAndUpdate({
						user:tokenObject.userId,
						activateCode:activateCode
					},{
						isActivated:true
					},{
						new:true
					},function(err,lr){
						latestRegistration = lr;
						stateMachine(err,STATE_SEND_RESPONSE);
					})

				break;
				case STATE_SEND_RESPONSE:
					if (latestRegistration != null && latestRegistration.isActivated) {
						res.send(util.wrapBody({activated:true}));
					}else{
						res.send(util.wrapBody({activated:false}));
					}
				break;
				default:
					console.log('Invalid State');
					res.send(util.wrapBody('Internal Error','E'));
			}
		}
	}
}

exports.updateProfile = function(req,res){
	var profile = req.body.profile;

	const STATE_CHECK_ACTIVATED = 1;
	const STATE_UPDATE_USER = 2;
	const STATE_SEND_RESPONSE = 0;

	var tokenObject = req.token;
	var latestRegistration = null;
	var latestUser = null;

	stateMachine(null,STATE_CHECK_ACTIVATED);

	function stateMachine(err,toState){
		console.log('state',toState);

		if (err) {
			console.log('error:',err);
			res.send(util.wrapBody('Internal Error','E'));

		}else{
			switch(toState){
				case STATE_CHECK_ACTIVATED:
					registrationModel
					.findOne({user:tokenObject.userId})
					.exec(function(err,lr){
						latestRegistration = lr;
						stateMachine(err,STATE_SEND_RESPONSE);
					});
				break;
				case STATE_UPDATE_USER:
					if (latestRegistration != null && latestRegistration.isActivated) {
						userModel
						.findOneAndUpdate({
							_id:tokenObject.userId
						},{
							nickname:profile.nickname
						},{
							new:true
						},function(err,lu){
							latestUser = lu;
							stateMachine(err,STATE_SEND_RESPONSE);
						});
					}else{
						stateMachine(err,STATE_SEND_RESPONSE);
					}

				break;
				case STATE_SEND_RESPONSE:
					if (!latestRegistration.isActivated) {
						res.send(util.wrapBody('Not activated','E'));
					}else if (latestUser != null) {
						res.send(util.wrapBody({isSuccessful:true}));
					}else{
						res.send(util.wrapBody({isSuccessful:false}));
					}
				break;
				default:
					console.log('Invalid State');
					res.send(util.wrapBody('Internal Error','E'));
			}
		}
	}
}

exports.wechatBinding = function(req,res){
	
	//States declaration
	const STATE_GET_TOKEN = 1;
	const STATE_GET_USER_INFO = 2;
	const STATE_UPDATE_USER_WECHAT = 3;
	const STATE_SEND_RESPONSE = 0;

	var code = req.body.code;
	var userId = req.token.userId
	var accessToken = null;
	var openId = null;
	var userInfo = null;
	var latestUserWechat = null;

	stateMachine(null,STATE_GET_TOKEN);

	function stateMachine(err,toState){


		if (err) {
			console.log('state:',toState);
			console.log('error:',err);
			res.send(util.wrapBody('Internal Error','E'));
		}else{
			console.log('state',toState);
			//console.log('argument',arguments[2]);

			switch(toState){
				case STATE_GET_TOKEN: 
					//get accessToken&openID by code
					wechat.getAccessToken(code,function(err,at,oi){
						accessToken = at;
						openId = oi;
						stateMachine(err,STATE_GET_USER_INFO);
					});
				break;
				case STATE_GET_USER_INFO:
					//get user info from wechat
					wechat.getUserInfo(accessToken,function(err,ui){
						userInfo = ui;
						stateMachine(err,STATE_CHECK_USER_EXIST);
					});
				break;
				case STATE_UPDATE_USER_WECHAT:
					//if the user-wechat exist
					userWechatModel
					.findOneAndUpdate({
						user:userId
					},userInfo,{
						upsert:true,
						new:true
					})
					.exec(function(err,luw){
						latestUserWechat = luw;
						stateMachine(err,STATE_UPDATE_USER);
					});
				break;
				case STATE_SEND_RESPONSE:
					if (latestUserWechat != null) {
						res.send(util.wrapBody({isSuccessful:true}));
					}else{
						res.send(util.wrapBody({isSuccessful:false}));
					}
				break;
				default:
					console.log('Invalid State');
					res.send(util.wrapBody('Internal Error','E'));
			}
		}
	}
}

exports.updatePassword = function(req,res){
	var userId = req.token.userId;
	var password = req.body.password;

	var latestUser = null;

	var STATE_UPDATE_PASSWORD = 1;
	var STATE_SEND_RESPONSE = 0;

	stateMachine(null,STATE_UPDATE_PASSWORD);

	function stateMachine(err,toState){
		console.log('current state:',toState);

		if (err) {
			console.log('error:',err);
			res.send(util.wrapBody('Internal Error','E'));
		} else {
			switch(toState){
				case STATE_UPDATE_PASSWORD:
					userModel
					.findOneAndUpdate({
						_id:userId
					},{
						password:encryptPassword(password)
					},{
						upsert:false
					},function(err,lu){
						latestUser = lu;
						stateMachine(err,STATE_SEND_RESPONSE);
					})
				break;
				case STATE_SEND_RESPONSE:
					if (latestUser != null) {
						res.send(util.wrapBody({isSuccessful:true}));
					}else{
						res.send(util.wrapBody({isSuccessful:false}));
					}
				break;
				default:
					console.log('Invalid State');
					res.send(util.wrapBody('Internal Error','E'));
			}
		}
	}

}

exports.resetPassword = function(req,res){
	var userId = req.token.userId;
	var password = req.body.password;

	var latestUser = null;
	var tempPassword = null;

	var STATE_UPDATE_PASSWORD = 1;
	var STATE_SEND_RESPONSE = 0;

	stateMachine(null,STATE_UPDATE_PASSWORD);

	function stateMachine(err,toState){
		console.log('current state:',toState);

		if (err) {
			console.log('error:',err);
			res.send(util.wrapBody('Internal Error','E'));
		} else {
			switch(toState){
				case STATE_UPDATE_PASSWORD:
					tempPassword = stringHelper.randomString(6,'all');
					userModel
					.findOneAndUpdate({
						_id:userId
					},{
						password:encryptPassword(tempPassword)
					},{
						upsert:false
					},function(err,lu){
						latestUser = lu;
						stateMachine(err,STATE_SEND_RESPONSE);
					})
				break;
				case STATE_SEND_RESPONSE:
					if (latestUser != null) {
						res.send(util.wrapBody({isSuccessful:true}));
					}else{
						res.send(util.wrapBody({isSuccessful:false,tempPassword:tempPassword}));
					}
				break;
				default:
					console.log('Invalid State');
					res.send(util.wrapBody('Internal Error','E'));
			}
		}
	}
}

exports.updateEmail = function(req,res){
	console.log('inside updateEmail',req.body);

	var email = req.body.email;
	var password = req.body.password;
	var userId = req.token.userId;

	const STATE_CHECK_EMAIL_USED = 1;
	const STATE_UPDATE_USER = 2;
	const STATE_UPDATE_REGISTRATION = 3;
	const STATE_SEND_RESPONSE = 0;

	var isUserExist = 0;
	var latestUser = null;
	var latestRegistration = null;
	var jwToken = null;

	stateMachine(null,STATE_CHECK_EMAIL_USED);

	function stateMachine(err,toState){
		console.log('current state:',toState);

		if (err) {
			console.log('error:',err);
			res.send(util.wrapBody('Internal Error','E'));
		} else {
			switch(toState){
				case STATE_CHECK_EMAIL_USED:
					userModel
					.count({
						email:email
					},function(err,count){
						isUserExist = count;
						stateMachine(err,STATE_UPDATE_USER);
					})
				break;
				case STATE_UPDATE_USER:
					if (isUserExist > 0) {
						stateMachine(err,STATE_SEND_RESPONSE);
					}else{
						userModel
						.findOneAndUpdate({
							_id:userId
						},{
							email:email
						},function(err,lu){
							latestUser = lu;
							stateMachine(err,STATE_UPDATE_REGISTRATION);
						});
					}
				break;
				case STATE_UPDATE_REGISTRATION:
					registrationModel
					.findOneAndUpdate({
						user:userId
					},{
						isActivated:false,
						activateCode:stringHelper.randomString(4,'digit')
					},{

					},function(err,lr){
						latestRegistration = lr;
						stateMachine(err,STATE_SEND_RESPONSE);
					})
				break;
				case STATE_SEND_RESPONSE:
					if (isUserExist > 0) {
						res.send(util.wrapBody('Email is used','E'));
					}else{
						res.send(util.wrapBody({activateCode:latestRegistration.activateCode}));
					}
				break;
				default:
					console.log('Invalid State');
					res.send(util.wrapBody('Internal Error','E'));
			}
		}
	}
}

exports.getAllUsers = function(req,res){
	
}

function encryptPassword(rawPassword){

	var sha1 = crypto.createHash('sha1');

	sha1.update(rawPassword);

	return sha1.digest('hex');
}




