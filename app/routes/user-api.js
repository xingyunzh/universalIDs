var express = require("express");
var router = express.Router();

var userController = require("../controllers/userController");
var authenticator = require('../authenticate/authenticator');

router.post('/register',userController.create);

router.post('/login/wechat',userController.loginByWechat);

router.post('/login/email',userController.loginByEmail);

router.post('/login/weapp',userController.loginByWeApp);

router.post('/login/weapp/2',userController.storeUserByWeApp);

router.post('/reset/password',userController.resetPassword);

router.get('/api/profile/:id',userController.getUserProfile);

router.post('/api/activated/email',authenticator.authenticate,userController.checkEmailActivated);

router.post('/api/activate/email',authenticator.authenticate,userController.activateEmail);

router.post('/api/update/profile',authenticator.authenticate,userController.update);

router.post('/api/update/password',authenticator.authenticate,userController.updatePassword);



module.exports = router;
