var userWechat = require('../models/userWechat');
var wechatApp = require('../models/wechatApp');
var userWechatApp = require('../models/userWechatApp');

exports.create = function(data) {
	return userWechat.create(data);
};

exports.findByUserId = function(userId){
	return userWechat.findOne({
		userId:userId
	}).lean().exec();
};

exports.findOne = function(conditions){
	return userWechat.findOne(conditions).populate({
		path:'user',
		select:'-password'
	}).lean().exec();
};
