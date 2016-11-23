var User = require('../models/user');

exports.update = function(conditions,data) {
	return User.findOneAndUpdate(conditions,data,{
		new:true
	}).select('-password').lean().exec();
};

exports.updateById = function(id,data){
	return User.findByIdAndUpdate(id,data).select('-password').lean().exec();
};

exports.findById = function(id) {
	return User.findById(id).select('-password').lean().exec();
};

exports.count = function(conditions){
	return User.count(conditions).exec();
};

exports.findOne = function(conditions){
	return User.findOne(conditions).select('-password').lean().exec();
};

exports.create = function(data){
	return User.create(data);
};

exports.query = function(options){
	

	var conditions = {};

	var totalCount = null;

	return User.count(conditions).then(function(result){
		totalCount = result;

		var pageNum = 0;
		var pageSize = 10;

		if ('pageNum' in options && 'pageSize' in options) {
			pageNum = options.pageNum;
			pageSize = options.pageSize;
		}

		var skipped = pageNum * pageSize;

		return User
		.find(conditions)
		.skip(skipped)
		.limit(pageSize)
		.exec();

	}).then(function(result){
		return {count:totalCount,users:result};
	});

};