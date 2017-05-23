
var wechatApp = require('../models/wechatApp');

exports.getAppByAlias = function(alias){
	return wechatApp.findOne({alias:alias}).lean().exec();
}

exports.create = function(data) {
	return wechatApp.create(data);
};

exports.update = function(conditions,data) {
	return wechatApp.findOneAndUpdate(conditions,data,{
		new:true
	}).lean().exec();
}
