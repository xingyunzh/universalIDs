var wechat = require('../authenticate/wechat-auth');
var util = require('../util/util');
var q = require('q');

exports.viaWechat = function(req,res) {
	
	var code = req.body.code;
	var app = req.body.app;

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
	}).then(function(userInfo){
		res.send(util.wrapBody(userInfo));
		
	}).catch(function(err){
		console.log(err);
		res.send(util.wrapBody('Adapter Error','E'));
	});
};


