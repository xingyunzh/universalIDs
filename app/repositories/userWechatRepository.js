var Wechat = require('../models/user-Wechat');

exports.create = function(data) {
	return Wechat.create(data);
};

exports.findByUserId = function(userId){
	return Wechat.findOne({
		userId:userId
	}).lean().exec();
};