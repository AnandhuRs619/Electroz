const express = require('express');
const UserRouter = express.Router();
const User = require("../models/userSchema");

// REQIRNIG 
const userController = require('../controllers/userControllers/userController');

const userAuth = require('../middleware/user');

// ROUTERS
UserRouter.get('/' ,userAuth.isLogin,userController.landingpage);
UserRouter.get('/login',userAuth.isLogin,userController.login);
UserRouter.get('/home',userAuth.isLogOut,userController.home);
UserRouter.post('/signup',userController.Signup);
UserRouter.get('/Erorr',userController.errorPage);
UserRouter.post("/otpPage",userController.verifyOtp);
UserRouter.post('/login',userAuth.isLogin,userController.verifyLogin);
UserRouter.get('/forgotPassword',userController.forgotpassword);

UserRouter.get('/logout',userAuth.isLogOut,userController.userLogout)
UserRouter.post('/send-otp',userController.sendOtp);
UserRouter.post('/Resend-otp',userController.againOtp);
UserRouter.post('/verify-otp',userController.verifyotpforpassword);
UserRouter.post('/newPassword',userController.resetPassword);
UserRouter.use(userAuth.isLogOut);
UserRouter.get('/productList',userController.productList);
UserRouter.get('/productList/filter',userController.filterProducts);
UserRouter.get('/checkout',userController.checkout);
UserRouter.post('/checkout/addAddress',userController.checkoutaddAdderss);
UserRouter.get('/cart',userController.Cart);
UserRouter.post("/cart/addingCart",userController.cartAdding);
UserRouter.post('/cart/quantity', userController.cartOuantity);
UserRouter.get('/cart/remove/:itemId',userController.cartRemove);
UserRouter.post('/cart/apply-coupon',userController.coupon);
UserRouter.post('/cart/remove-coupon',userController.removeCoupon);
UserRouter.get('/productList/productDetails/:id',userController.productDetails);
UserRouter.get('/manageAddress',userController.userProfile);
UserRouter.get('/myprofile',userController.Myprofile);
UserRouter.post('/myprofile/editProfile',userController.editProfile);
UserRouter.post('/profile/sendOTP',userController.profileOtp);
UserRouter.post('/passwordChange/sendOTP',userController.paswordChange);
UserRouter.post('/profile/changePassword',userController.changePassword);
UserRouter.post('/profie/addAddress',userController.addAddress);
UserRouter.post('/profie/editAddress',userController.editAddress);
UserRouter.post('/profile/deleteAddress',userController.deleteAdress);
UserRouter.get('/Mywishlist',userController.myWishlist);
UserRouter.post('/Mywishlist/addtoWishlist',userController.addToWishlist);
UserRouter.get('/Myorders',userController.myOrder);
UserRouter.post('/order',userController.order);
UserRouter.post('/save-payment',userController.savePayment);
UserRouter.get('/Myorders/orderDetials',userController.orderDetails);
UserRouter.post('/orders/cancel/:id', userController.cancelOrder);
UserRouter.post('/orders/return/:id',userController.returnOrder);
UserRouter.post('/searchProduct', userController.searchProduct);
UserRouter.get('/profile/WalletHistory',userController.WalletHistory);
UserRouter.get('/download-invoice',userController.downloadInvoice);
UserRouter.post('/invoiceData',userController.generateInvoice);




// EXPORTING
module.exports = UserRouter;