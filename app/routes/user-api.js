var express = require("express");
var router = express.Router();

var userController = require("../controllers/user-controller");

router.get('/login/wechat',userController.loginByWechat);

module.exports = router;