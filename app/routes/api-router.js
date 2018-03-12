var express = require("express");
var router = express.Router();

var userAPI = require("./user-api");
var thirdPartyLoginAPI = require('./thirdPartyLogin-api');
var wechatAppAPI = require('./wechatApp-api');


module.exports = router;

router.use("/clduser", userAPI);
router.use("/user", userAPI);

router.use("/adapter",thirdPartyLoginAPI);

router.use("/wca",wechatAppAPI);
