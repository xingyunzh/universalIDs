
var userWechatApp = require('../models/userWechatApp');

exports.create = function(data) {
	return userWechatApp.create(data);
};

exports.findByOpenIdAndApp = function(openId,appId){
	return userWechatApp.findOne({
		openId:openId,
		wechatApp:appId
	})
	.populate({
		path:'userWechat',
		populate:{
			path:'user'
		}
	})
	.lean().exec();
};

exports.update = function(conditions,data,options){
	return userWechatApp.findOneAndUpdate(conditions,data,{
		upsert:true,
		new:true
	})
	// .populate({
	// 	path:'wechatApp userWechat',
	// 	populate:{
	// 		path:'user'
	// 	}
	// })
	.lean().exec();
};
