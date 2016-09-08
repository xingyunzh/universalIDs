var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var userSchema = Schema({
	//username:String,

	password:{
		type:String,
	},

	nickname:String,
	
	createdDate:{
		type:Date,
		'default': new Date()
	},

	email:{
		type:String,

	},

	lastLoginDate:Date
});

module.exports = mongoose.model('User',userSchema);


