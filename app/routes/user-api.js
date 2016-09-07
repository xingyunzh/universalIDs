var express = require("express");
var router = express.Router();

var userController = require("../controllers/user-controller");
var accessControl = require('./accessControl.js');

accessControl(router);

router.post('/login/wechat',userController.loginByWechat);

router.post('/login/email',userController.login);

router.post('/api/activated',userController.checkIfActivated);

router.post('/api/profile',userController.getUserProfile);

router.post('/register',userController.createUser);

router.post('/api/activate',userController.activateUser);

router.post('/api/profile/update',userController.updateUser);

router.post('/api/password/reset',userController.updatePassword);

router.post('/api/password/update',userController.resetPassword);

router.get('/list',userController.getAllUsers)

module.exports = router;