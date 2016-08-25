var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var userWechatSchema = Schema({
	user:{
		type:Schema.Types.ObjectId,
        ref: 'User'
	},

	nickname:String,

	sex:Number,

	province:String,

	city:String,

	country:String,

	headImgUrl:String,

	privilege:[],

	openID:{
		type:Array,
		index:true
	},

	unionID:{
		type:String,
		index:true
	}

});

module.exports = mongoose.model('User-Wechat',userWechatSchema);


