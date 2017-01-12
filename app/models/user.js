var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var userSchema = Schema({
	//username:String,

	password:{
		type:String
	},

	nickname:String,
	
	createdDate:{
		type:Date,
		'default': new Date()
	},

	email:{
		type:String,
		index:true
	},

	gender:Number,

	lastLoginDate:{
		type:Date,
		'default': new Date()
	},

	// wechatOpenId:String,

	// wechatUnionId:String,

	// city:String,

	// country:String,

	headImgUrl:String,
});

module.exports = mongoose.model('User',userSchema);


