var OAuth = require('wechat-oauth');
var client = new OAuth('wx5ce7696222e79ca5', 'f9b1976f789b15a56adc6775353cecab');

exports.getAccessToken = function(code,callback){
	client.getAccessToken(code, function (err, result) {
  		var accessToken = result.data.access_token;
  		var openid = result.data.openid;
  		callback(err,accessToken,openid);
	});
}

exports.getUserInfo = function(openid,callback) {
	client.getUser(openid, function (err, result) {
  		callback(err,result);
	});
}