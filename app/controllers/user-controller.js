var wechat = require('../util/wechat-auth.js');
var util = require('../util/shared/util.js');

var userModel = require('../models/user.js');
var userWechatModel = require('../models/user-wechat.js');


exports.loginByWechat = function(req,res){

	stateMachine(null,0);

	function stateMachine(err,toState){
		//States declaration
		const STATE_GET_TOKEN = 0;
		const STATE_GET_USER_INFO = 1;
		const STATE_CHECK_USER_EXIST = 2;
		const STATE_UPDATE_USER_INFO = 3;
		const STATE_CREATE_USER = 4;
		const STATE_CREATE_USER_WECHAT = 5;
		const STATE_BUILD_RESPONSE = 6;
		const STATE_SEND_RESPONSE = 7;

		if (err) {
			console.log('state:',toState);
			console.log('error:',err);
			res.send(util.wrapBody('Internal Error','E'));
		}else{
			switch(toState){
				case STATE_GET_TOKEN: 
					//get accessToken&openID by code
					var code = req.query.code;
					wechat.getAccessToken(code,function(err,accessToken,openId){
						stateMachine(err,STATE_GET_USER_INFO,accessToken,openId);
					});
				break;
				case STATE_GET_USER_INFO:
					//get user info from wechat
					wechat.getUserInfo(arguments[3],function(err,userInfo){
						stateMachine(err,STATE_CHECK_USER_EXIST,userInfo);
					});
				break;
				case STATE_CHECK_USER_EXIST:
					var userInfo = arguments[2];
					
					userWechatModel
					.findOne({unionID:userInfo.unionID})
					.populate('user')
					.exec(function(err,result){
						stateMachine(err,STATE_UPDATE_USER_INFO,result,userInfo);
					});
				break;
				case STATE_UPDATE_USER_INFO:
					//if the user-wechat exist
					var userInfo = arguments[2];

					userWechatModel
					.update(userInfo)
					.exec(function(err,result){
						stateMachine(err,STATE_BUILD_RESPONSE,result);
					});
				break;
				case STATE_CREATE_USER:
					//if the user-wechat does not exist,create user
					var userInfo = arguments[2];

					var newUser = new userModel();
					newUser.nickname = userInfo.nickname;
					//newUser.createdDate = new Date();
					newUser.lastLoginDate = new Date();

					newUser
					.save(function(err,result){
						stateMachine(err,STATE_CREATE_USER_WECHAT,result,userInfo);
					});
				break;
				case STATE_CREATE_USER_WECHAT:
					var user = arguments[2];
					var userInfo = arguments[3];

					var newUserWechat = new userWechatModel();
					newUserWechat.user = user._id;
					newUserWechat.nickname = userInfo.nickname;
					newUserWechat.sex = userInfo.sex;
					newUserWechat.province = userInfo.province;
					newUserWechat.city = userInfo.city;
					newUserWechat.country = userInfo.country;
					newUserWechat.privilege = userInfo.privilege;
					newUserWechat.unionID = userInfo.unionID;

					newUserWechat
					.save(function(err,result){
						stateMachine(err,STATE_BUILD_RESPONSE,result);
					});

				break;
				case STATE_BUILD_RESPONSE:
					var userWechat = arguments[2];
					
					User
					.findOne(userWechat._id)
					.populate('user')
					.exec(function(err,result){
						stateMachine(err,STATE_SEND_RESPONSE,result);
					});
				break;
				case STATE_SEND_RESPONSE:
					var result = arguments[2];

					res.send(util.wrapBody(result));
				break;
				default: res.send(util.wrapBody('Internal Error','E'));
			}
		}
	}

};

exports.getUserInfo = function(req,res){
	var userId = req.body.userId;

	userModel
	.findOne(userId)
	.exec(function(err,result){
		if (err) {
			console.log('error',err);
			res.send(util.wrapBody('Internal Error','E'));
		}else if(result){
			res.send(util.wrapBody(result));
		}else{
			console.log('error','No user found');
			res.send(util.wrapBody('No user found','E'));
		};
	});
};




