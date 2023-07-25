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
UserRouter.get('/cart/remove/:itemId',userController.cartRemove);
UserRouter.post('/cart/apply-coupon',userController.coupon);
UserRouter.get('/productList/productDetails/:id',userController.productDetails);
UserRouter.get('/manageAddress',userController.userProfile);
UserRouter.get('/myprofile',userController.Myprofile);
UserRouter.post('/myprofile/editProfile',userController.editProfile);
UserRouter.post('/profile/sendOTP',userController.profileOtp);
UserRouter.post('/passwordChange/sendOTP',userController.paswordChange);
UserRouter.post('/profile/changePassword',userController.changePassword);
UserRouter.post('/profie/addAddress',userController.addAddress);
UserRouter.post('/profie/editAddress',userController.editAddress);
UserRouter.get('/Mywishlist',userController.myWishlist);
UserRouter.post('/Mywishlist/addtoWishlist',userController.addToWishlist);
UserRouter.get('/Myorders',userController.myOrder);
UserRouter.post('/order',userController.order);
UserRouter.post('/save-payment',userController.savePayment);
UserRouter.get('/Myorders/orderDetials',userController.orderDetails);
UserRouter.post('/orders/cancel/:id', userController.cancelOrder);
UserRouter.post('/orders/return/:id',userController.returnOrder);
UserRouter.put('/products/:productId/quantity', userController.cartOuantity);
UserRouter.post('/searchProduct', userController.searchProduct);




// EXPORTING
module.exports = UserRouter;