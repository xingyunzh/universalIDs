var express = require("express");
var router = express.Router();

var userController = require("../controllers/user-controller");
var accessControl = require('./accessControl.js');

accessControl(router);

router.post('/login/wechat',userController.loginByWechat);

router.post('/login/email',userController.login);

router.post('/api/checkIfActivated',userController.checkIfActivated);

router.post('/api/getUserInfo',userController.getUserInfo);

router.post('/register',userController.createUser);

router.post('/api/activate',userController.activateUser);

router.get('/list',userController.getAllUsers)

module.exports = router;