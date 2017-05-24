
var userWechatApp = require('../models/userWechatApp');

exports.create = function(data) {
	return userWechatApp.create(data);
};

exports.findByOpenIdAndAlias = function(openId,appId){
	return userWechatApp.findOne({
		openId:openId,
		wechatApp:appId
	}).lean().exec();
};

exports.update = function(conditions,data,options){
	return userWechatApp.findOne(conditions,data,{
		upsert:true,
		new:true
	}).populate({
		path:'wechatApp userWechat',
		populate:{
			path:'user'
		}
	}).lean().exec();
};
