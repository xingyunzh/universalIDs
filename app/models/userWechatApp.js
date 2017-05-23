var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var userWechatAppSchema = Schema({

  wechatApp:{
    type:Schema.Types.ObjectId,
    ref:'WechatApp',
  },

  openId:String,

  userWechat:{
    type:Schema.Types.ObjectId,
    ref:'UserWechat'
  }
});

module.exports = mongoose.model('UserWechatApp',userWechatAppSchema);
