var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var wechatAppSchema = Schema({
  alias:{
    type:String,
    index:true
  },

  appId:String,

  secret:String
});

module.exports = mongoose.model('WechatApp',wechatAppSchema);
