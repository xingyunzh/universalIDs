var express = require("express");
var router = express.Router();

var wechatLoginAdapter = require("../controllers/wechatLoginAdapter");


router.post('/login/wechat',wechatLoginAdapter.viaWechat);

router.post('/login/weapp',wechatLoginAdapter.viaWeApp);


module.exports = router;