var wechat = require('../authenticate/wechat/oauth');
var wechatAppRepository = require('../repositories/wechatAppRepository');
var util = require('../util/util');
var q = require('q');

exports.viaWeApp = function(req,res){
	var code = req.body.code;
	var alias = req.body.app;

	wechatAppRepository.getAppByAlias(alias).then(function(app){
		var client = new wechat(app.appId,app.secret);

		var deferred = q.defer();

		client.getOpenIdByCode(code,function(err,session){
			if (err) {
				deferred.reject(err);
			}else{
				deferred.resolve(session);
			}
		});

		return deferred;

	}).then(function(session){
		res.send(util.wrapBody(session));

	}).catch(function(err){
		console.log(err);
		res.send(util.wrapBody('Adapter Error','E'));
	});
};

exports.viaWechat = function(req,res) {

	var code = req.body.code;
	var alias = req.body.app;

	wechatAppRepository.getAppByAlias(alias).then(function(app){
		var client = new wechat(app.appId,app.secret);

		var deferred = q.defer();

		client.getUserByCode(code,function(err,userInfo){
			if (err) {
				deferred.reject(err);
			}else{
				deferred.resolve(userInfo);
			}
		});

		return deferred;

	}).then(function(userInfo){
		res.send(util.wrapBody(userInfo));

	}).catch(function(err){
		console.log(err);
		res.send(util.wrapBody('Adapter Error','E'));
	});
};
