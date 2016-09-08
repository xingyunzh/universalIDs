var express = require("express");
var router = express.Router();

var userController = require("../controllers/user-controller");
var accessControl = require('./accessControl.js');

accessControl(router);

router.post('/register',userController.createUser);

router.post('/login/wechat',userController.loginByWechat);

router.post('/login/email',userController.login);

router.post('/api/profile',userController.getUserProfile);

router.post('/api/activated/email',userController.checkEmailActivated);

router.post('/api/activate/email',userController.activateEmail);

router.post('/api/update/profile',userController.updateProfile);

router.post('/api/update/email',userController.updateEmail);

router.post('/api/update/password',userController.updatePassword);

router.post('/api/reset/password',userController.resetPassword);

router.get('/list',userController.getAllUsers)

module.exports = router;