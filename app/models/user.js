var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var userSchema = Schema({
	username:String,

	password:{
		type:String,
		'default':'000000'
	},

	nickname:String,

	// gender:Number,

	// province:String,

	// city:String,

	// country:String,

	// headImgUrl:String,

	// privilege:[],

	// openID:{
	// 	type:Array,
	// 	index:true
	// },

	// unionID:{
	// 	type:String,
	// 	index:true
	// },
	
	createdDate:{
		type:Date,
		'default': new Date()
	},

	email:String,

	lastLoginDate:Date
});

module.exports = mongoose.model('User',userSchema);


