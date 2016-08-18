var wechat = require('../util/wechat-auth.js');
var util = require('../util/shared/util.js');

var userModel = require('../models/user.js');


exports.loginByWechat = function(req,res){
	var stateMachine = function(err,toState){
		if (err) {
			console.log('state:',toState);
			console.log('error:',err);
			res.send(util.wrapBody('Internal Error','E'));
		}else{
			switch(toState){
				case 0: 
					//get accessToken&openID by code
					var code = req.query.code;
					wechat.getAccessToken(code,function(err,accessToken,openId){
						stateMachine(err,1,accessToken,openId);
					});
				break;
				case 1:
					//get user info from wechat
					wechat.getUserInfo(arguments[3],function(err,userInfo){
						stateMachine(err,2,userInfo);
					});
				break;
				case 2:
					//check if the user exists
					var userInfo = arguments[2];
					userModel
					.findOne({unionID:userInfo.unionID})
					.exec(function(err,result){
						stateMachine(err,3,result,userInfo);
					});
				break;
				case 3:
					var userInfo = arguments[3];
					if (arguments[2] == null) {
						//if the user does not exist
						var newUser = new userModel();
						newUser.nickname = userInfo.nickname;
						newUser.gender = userInfo.sex;
						newUser.province = userInfo.province;
						newUser.city = userInfo.city;
						newUser.country = userInfo.country;
						newUser.privilege = userInfo.privilege;
						newUser.createdDate = new Date();
						newUser.lastLoginDate = new Date();
						newUser.unionID = userInfo.unionID;
						//to do

						newUser
						.save()
						.exec(function(err,result){
							stateMachine(err,4,result);
						});
					}else{
						//if the user exist
						userModel
						.update(userInfo)
						.exec(function(err,result){
							stateMachine(err,4,result);
						});
					};
				break;
				case 4:
					//send response
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




