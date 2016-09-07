var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var registrationSchema = Schema({
	user:{
		type:Schema.Types.ObjectId,
        ref: 'User',
        unique:true
	},

	activateCode:String,

	registerDate:{
		type:Date,
		default:new Date()
	},

	//temporaryPassword:String,

	isActivated:{
		type:Boolean,
		default:false
	}
});

module.exports = mongoose.model('Registration',registrationSchema);


