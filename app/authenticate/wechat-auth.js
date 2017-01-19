var OAuth = require('wechat-oauth');
var systemConfigRepository = require('../repositories/systemConfigRepository');

exports.getClientByApp = function(app){
	return systemConfigRepository.getWechatCredentials().then(function(wechat){
		var credentials = wechat[app];
		var client = new OAuth(credentials.appid,credentials.secret);
		return client;
	});
};

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