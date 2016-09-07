var wechat = require('../util/wechat-auth.js');
var util = require('../util/shared/util.js');
var crypto = require('crypto');

var userModel = require('../models/user');
var userWechatModel = require('../models/user-wechat');
var fullProfile = require('../models/full-profile');

var XINGYUNZH_UNIVERSAL_SECRET = "xingyunzh-universal-secret";

exports.loginByWechat = function(req,res){

	stateMachine(null,1);

	function stateMachine(err,toState){
		//States declaration
		const STATE_GET_TOKEN = 1;
		const STATE_GET_USER_INFO = 2;
		const STATE_CHECK_USER_EXIST = 3;
		const STATE_UPDATE_USER_INFO = 4;
		const STATE_CREATE_USER = 5;
		const STATE_CREATE_USER_WECHAT = 6;
		const STATE_CREATE_TOKEN = 7;
		const STATE_SEND_RESPONSE = 0;

		var code = req.query.code;
		var accessToken = null;
		var openId = null;
		var userInfo = null;
		var latestUserWechat = null;
		var jwToken = null;
		var latestUser = null;

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
				case STATE_CHECK_USER_EXIST:

					userWechatModel
					.findOne({unionID:userInfo.unionID})
					//.populate('user')
					.exec(function(err,result){
						if(result == null){
							stateMachine(err,STATE_CREATE_USER);
						}else{
							stateMachine(err,STATE_UPDATE_USER_INFO);
						}
					});
				break;
				case STATE_UPDATE_USER_INFO:
					//if the user-wechat exist
					userWechatModel
					.update(userInfo)
					.populate('user')
					.exec(function(err,luw){
						latestUserWechat = luw;
						stateMachine(err,STATE_CREATE_TOKEN);
					});
				break;
				case STATE_CREATE_USER:
					//if the user-wechat does not exist,create user
					var newUser = new userModel();
					newUser.nickname = userInfo.nickname;
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
					
					jwt.sign({userId:latestUser._id},
						'xingyunzh-universal-secret',
						{expiresIn:3600},
						function(err,jt){
							jwToken = jt;
							stateMachine(err,STATE_SEND_RESPONSE);
					});

				break;
				case STATE_SEND_RESPONSE:
					var result = {token:jwToken,nickname:latestUser.nickname};

					res.send(util.wrapBody(result));
				break;
				default: res.send(util.wrapBody('Internal Error','E'));
			}
		}
	}

};

exports.getUserInfo = function(req,res){
	var tokenString = req.body.token;

	function stateMachine(err,toState){

		const STATE_VERIFY_TOKEN = 1;
		const STATE_GET_USER_PROFILE = 2;
		const STATE_GET_WECHAT_PROFILE = 3;
		const STATE_BUILD_FULL_PROFILE = 4;
		const STATE_SEND_RESPONSE = 0;

		var tokenObject = null;
		var latestUser = null;
		var latestUserWechat = null;
		var latestFullProfile = null;

		if (err) {
			console.log('state:',toState);
			console.log('error:',err);
			if (toState == STATE_VERIFY_TOKEN) {
				res.send(util.wrapBody('Invalid Token','E'));
			}else{
				res.send(util.wrapBody('Internal Error','E'));
			}

		}else{
			console.log('state',toState);

			switch(toState){
				case STATE_VERIFY_TOKEN:
					jwt.verify(tokenString,
						XINGYUNZH_UNIVERSAL_SECRET,
						function(err,to){
							tokenObject = to;
							stateMachine(err,STATE_GET_USER_PROFILE);
						});
				break;
				case STATE_GET_USER_PROFILE:
					userModel
					.findOne(tokenObject.userId)
					.exec(function(err,lu){
						latestUser = lu;
						stateMachine(err,STATE_GET_WECHAT_PROFILE);
					});
				break;
				case STATE_GET_WECHAT_PROFILE:

					userWechatModel
					.findOne({user:latestUser._id})
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
					res.send(util.wrapBody({userInfo:latestFullProfile}));
				break;
				default: 
					console.log('Invalid State');
					res.send(util.wrapBody('Internal Error','E'));
			}
		}
	}


	// jwt.verify(tokenString,
	// 	XINGYUNZH_UNIVERSAL_SECRET,
	// 	function(err,tokenObject){
	// 		if (err) {
	// 			console.log('error',err);
	// 			res.send(util.wrapBody('Invalid Token','E'));
	// 		}else{
	// 			userModel
	// 			.findOne(tokenObject.userId)
	// 			.exec(function(err,result){
	// 				if (err) {
	// 					console.log('error',err);
	// 					res.send(util.wrapBody('Internal Error','E'));
	// 				}else if(result){
	// 					userWechatModel
	// 					.findOne({user:result._id})
	// 					.exec(function(err,result){
							
	// 					})
	// 					res.send(util.wrapBody(userInfo:result));
	// 				}else{
	// 					console.log('error','No user found');
	// 					res.send(util.wrapBody('No user found','E'));
	// 				};
	// 			});
	// 		}
	// });
};

exports.login = function(req,res){
	var email = req.body.email;
	var password = req.body.password;

	userModel
	.update({
		email:email,
		password:encryptPassword(password)
	},{
		latestLoginDate:new Date()
	}).exec(function(err,result){

	})
}

exports.createUser = function(req,res){

}

exports.updateUser = function(req,res){

}

exports.wechatBinding = function(req,res){
	
}

function encryptPassword(rawPassword){
	var sha1 = crypto.createHash('sha1');

	sha1.update(rawPassword);

	return sha1.digest('hex');
}



