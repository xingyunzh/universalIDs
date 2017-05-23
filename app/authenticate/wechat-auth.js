var OAuth = require('./wechat/oauth');
var wechatAppRepository = require('../repositories/wechatAppRepository');

exports.getUserByCode(alias,code,callback){
	wechatAppRepository.getAppByAlias(alias).then(function(app){
		var client = new OAuth(app.appId,app.secret);
		client.getUserByCode(code,callback);
	}).catch(function(err){
		callback(err);
	})
}
exports.getClientByApp = function(alias){
	return wechatAppRepository.getAppByAlias(alias).then(function(app){
		var client = new OAuth(app.appId,app.secret);
		return client;
	})
	// return systemConfigRepository.getWechatCredentials().then(function(wechat){
	// 	var credentials = wechat[app];
	// 	var client = new OAuth(credentials.appid,credentials.secret);
	// 	return client;
	// });
};

exports.getUserByCode = function(client,code,callback){
	client.getUserByCode(code,callback);
}

exports.getAccessToken = function(client,code,callback){
	client.getAccessToken(code, function (err, result) {
		if (err) {
			console.log('code:',code);
			console.log('get access token error:',err);
			callback(err);
		}else{

			//console.log('result',result);
	  		var accessToken = result.data.access_token;
	  		var openid = result.data.openid;
	  		callback(null,accessToken,openid);
	  	}
	});
};

exports.getUserInfo = function(client,openid,callback) {
	client.getUser(openid, function (err, result) {
  		callback(err,result);
	});
}
