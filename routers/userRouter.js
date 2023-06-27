const express = require('express');
const UserRouter = express.Router();
const User = require("../models/userSchema");

// REQIRNIG 
const userController = require('../controllers/userControllers/userController');
const userAuth = require('../middleware/user');

// ROUTERS
UserRouter.get('/login',userAuth.isLogin,userController.login);
UserRouter.get('/',userAuth.isLogOut,userController.home);
UserRouter.post('/signup',userController.Signup);
// UserRouter.post("/otpPage",userController.loadOtp);
UserRouter.post("/otpPage",userController.verifyOtp);
UserRouter.post('/login',userAuth.isLogin,userController.verifyLogin);

UserRouter.get('/logout',userAuth.isLogOut,userController.userLogout)
// UserRouter.use(userAuth.isLogin);

UserRouter.get('/productList',userController.productList);

UserRouter.get('/productList/productDetails/:id',userController.productDetails);


// EXPORTING
module.exports = UserRouter;