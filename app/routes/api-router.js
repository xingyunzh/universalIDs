var express = require("express");
var router = express.Router();

var userAPI = require("./user-api");


module.exports = router;

router.use("/clduser", userAPI);