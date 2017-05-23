var express = require("express");
var router = express.Router();

var wechatAppController = require("../controllers/wechatAppController");

router.post('/create',wechatAppController.create);



module.exports = router;
