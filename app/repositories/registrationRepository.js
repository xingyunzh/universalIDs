var Registration = require('../models/registration');

exports.create = function(data) {
	return Registration.create(data);
};

exports.findOne = function(conditions){
	return Registration.findOne(conditions).lean().exec();
};