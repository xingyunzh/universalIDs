var express = require("express");
var router = express.Router();

var userAPI = require("./user-api");
var thirdPartyLoginAPI = require('./thirdPartyLogin-api');


module.exports = router;

router.use("/clduser", userAPI);

router.use("/adapter",thirdPartyLoginAPI);