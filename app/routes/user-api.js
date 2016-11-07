var express = require("express");
var router = express.Router();

var userController = require("../controllers/user-controller");
var authenticator = require('../authenticate/authenticator');

//accessControl(router);

router.use('/api',authenticator.authenticate);

router.get('/test/mail',userController.testingMail);

router.post('/test/user',userController.addTestUser);

router.post('/register',userController.createUser);

router.post('/login/wechat',userController.loginByWechat);

router.post('/login/email',userController.loginByEmail);

router.post('/reset/password',userController.resetPassword);

router.get('/list',userController.getAllUsers);

router.post('/api/profile',userController.getUserProfile);

router.post('/api/activated/email',userController.checkEmailActivated);

router.post('/api/activate/email',userController.activateEmail);

router.post('/api/update/profile',userController.updateProfile);

router.post('/api/update/email',userController.updateEmail);

router.post('/api/update/password',userController.updatePassword);



module.exports = router;