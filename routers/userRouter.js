const express = require('express');
const UserRouter = express.Router();
const User = require("../models/userSchema");

// REQIRNIG 
const userController = require('../controllers/userControllers/userController');
const profileController = require('../controllers/userControllers/profileController');

const userAuth = require('../middleware/user');

// ROUTERS
UserRouter.get('/login',userAuth.isLogin,userController.login);
UserRouter.get('/',userAuth.isLogOut,userController.home);
UserRouter.post('/signup',userController.Signup);

UserRouter.post("/otpPage",userController.verifyOtp);
UserRouter.post('/login',userAuth.isLogin,userController.verifyLogin);

UserRouter.get('/logout',userAuth.isLogOut,userController.userLogout)
UserRouter.use(userAuth.isLogOut);
UserRouter.get('/forgotPassword',userController.forgotpassword);
UserRouter.post('/send-otp',userController.sendOtp);
UserRouter.post('/verify-otp',userController.verifyotp);
UserRouter.post('/reset-password',userController.resetPassword);
UserRouter.get('/productList',userController.productList);
UserRouter.get('/checkout',userController.checkout);
UserRouter.get('/cart',userController.Cart);
UserRouter.post("/cart/addingCart",userController.cartAdding);
UserRouter.get('/cart/remove/:id',userController.cartRemove);
UserRouter.get('/productList/productDetails/:id',userController.productDetails);
UserRouter.get('/profile',userController.userProfile);
UserRouter.post('/profie/addAddress',userController.addAddress);
UserRouter.post('/profie/editAddress',userController.editAddress);
UserRouter.get('/Myorders',userController.myOrder);
UserRouter.post('/order',userController.order);
UserRouter.get('/Myorders/orderDetials/:_id',userController.orderDetails);

// EXPORTING
module.exports = UserRouter;