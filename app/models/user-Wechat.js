
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var userWechatSchema = Schema({

	user:{
		type:Schema.Types.ObjectId,
        ref: 'User',
        index:true
	},

	nickname:String,

	sex:Number,

	openId:String,

	unionId:String,

	city:String,

	country:String,

	headImgUrl:String,
});

module.exports = mongoose.model('UserWechat',userWechatSchema);


