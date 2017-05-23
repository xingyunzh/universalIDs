var express = require("express");
var router = express.Router();

var wechatAppController = require("../controllers/wechatAppController");

router.get('/create',wechatAppController.create);



module.exports = router;
