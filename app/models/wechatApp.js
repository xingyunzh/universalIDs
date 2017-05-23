var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var wechatAppSchema = Schema({
  alias:{
    type:String,
    index:true
  },

  appId:String,

  appSecret:String
});

module.exports = mongoose.model('WechatApp',wechatAppSchema);
