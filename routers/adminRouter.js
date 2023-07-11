const express = require("express");
const adminRouter = express.Router();
const adminController = require("../controllers/adminControllers/adminController");
const adminAuth = require('../middleware/admin');


//  Multer config
const upload = require('../middleware/multer');




// ADMIN SIDE login & Dashboar
adminRouter.get('/adminLogin',adminAuth.isAdmin,adminController.adminLogin);
adminRouter.get('/Dashboard',adminAuth.isLogOut, adminController.dashboard);
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
adminRouter.get('/customerLists',adminController.customerList);
adminRouter.post('/customerUpdate/:id',adminController.blockUser);
adminRouter.get('/orderList',adminController.orderlist);
adminRouter.post('/orderUpdate',adminController.orderupdate);
adminRouter.get('*',function(req,res){
    res.redirect('/admin')
});

module.exports= adminRouter