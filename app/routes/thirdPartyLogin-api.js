var express = require("express");
var router = express.Router();

var loginAdapter = require("../controllers/loginAdapter");


router.post('/login/wechat',loginAdapter.viaWechat);



module.exports = router;