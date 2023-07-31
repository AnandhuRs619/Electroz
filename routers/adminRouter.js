const express = require("express");
const adminRouter = express.Router();
const adminController = require("../controllers/adminControllers/adminController");
const adminAuth = require('../middleware/admin');


//  Multer config
const upload = require('../middleware/multer');




// ADMIN SIDE login & Dashboar
adminRouter.get('/adminLogin',adminAuth.isAdmin,adminController.adminLogin);
adminRouter.get('/Dashboard',adminAuth.isLogOut, adminController.dashboard);
adminRouter.get('/api/dashboard',adminController.ChartData);
adminRouter.post('/adminLogin',adminAuth.isAdmin,adminController.adminVerify);
adminRouter.get('/Logout',adminController.adminLogout);

adminRouter.use(adminAuth.isLogOut);
adminRouter.get('/productLists',adminController.productLists);
adminRouter.get('/productDetails',adminController.productDetails)
adminRouter.get('/addproducts',adminController.productAdding);
adminRouter.post('/addproducts', upload.array('image'),adminController.addingNewProduct);
adminRouter.get('/editproducts/:id',adminController.loadedit);
adminRouter.post('/editproducts/:id',upload.array('image'),adminController.editProduct);
adminRouter.post('/deleteproduct',adminController.removeProduct);
adminRouter.get('/categoryList',adminController.categoryList);
adminRouter.post('/categoryList',adminController.categoryAdding);
adminRouter.post('/categoryEdit',adminController.categoryEdit);
adminRouter.patch('/categorydelete/:id',adminController.removeCategory);
adminRouter.get('/customerLists',adminController.customerList);
adminRouter.post('/customerUpdate/:id',adminController.blockUser);
adminRouter.get('/orderList',adminController.orderlist);
adminRouter.post('/orderUpdate',adminController.orderupdate);
adminRouter.get('/couponList',adminController.couponList);
adminRouter.post('/addcoupon',adminController.addCoupon);
adminRouter.post('/editCoupon',adminController.editCoupon);
adminRouter.post('/removeCoupon',adminController.removeCoupon);
adminRouter.get('/bannarlist',adminController.banner);
adminRouter.post('/addbanner',upload.array('image'),adminController.addBanner);
adminRouter.post('/editbanner',upload.array('image'),adminController.editBanner);
adminRouter.get("/hideBanner",adminController.hideBanner);
adminRouter.get('*',function(req,res){
    res.redirect('/admin')
});

module.exports= adminRouter