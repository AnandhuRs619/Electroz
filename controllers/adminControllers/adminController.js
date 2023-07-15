const admin =require('../../models/adminSchema');
const bcrypt = require("bcrypt");
const User = require('../../models/userSchema');
const productModel = require('../../models/productModel');
const categorySchema =require('../../models/categorySchema');
const orderModel = require('../../models/OderSchema');
const Coupon = require('../../models/couponSchema');


// ADMIN LOGIN
const adminLogin = async (req,res)=>{
    try{
         const user = req.session.user;
        res.render('adminSide/adminLogin')
    }catch(error){
        console.error(error);
        res.status(500).send("Internal  Server Error")
    }
   
}


const adminVerify = async (req,res)=>{
    try{
      
        const email = req.body.email;
        const password = req.body.password
        const adminData = await admin.findOne({ email: email});
        if(adminData){
            const adminpassword = bcrypt.compare(password,adminData.password);
                   
            if(adminpassword){
                req.session.admin = adminData._id;
                
                res.redirect('/admin/Dashboard')
            }else{
                res.render('adminSide/adminLogin',{fail : "Check Your Password"})
            }
        }else{
            res.render('adminSide/adminLogin',{fail : "Check Your Email"})
        }
        
    }catch(error){
        console.error(error);
        res.status(500).send("Internal  Server Error") 
    }
}

// ADMIN HOME RENDERING
const dashboard = async (req,res)=>{
    try {
        res.render('adminSide/Dashboard');
    }catch(error){
        console.error(error);
        res.status(500).send("Internal  Server Error");
    }

   
}

// Product Listing and details

const productLists = async (req, res)=>{
    try{
        const product = await productModel.find({ isAvailable: true });
        res.render('adminSide/admin-ProductsList',{title : "Product",admin:req.session.admin, product});
    }catch(error){
        console.error(error);
        res.status(500).send("Internal  Server Error");
    }

}

const productDetails = async(req,res)=>{
    try{
        res.render('adminSide/admin-Productdetails',{admin:req.session.admin});
    }catch(error){
        console.error(error);
        res.status(500).send("Internal  Server Error")
    }
}
const productAdding = async(req,res)=>{
    try{
        const category = await categorySchema.find({isAvailable:true});
        res.render('adminSide/admin-Addproducts',{category});
    }catch(error){
        console.error(error);
        res.status(500).send("Internal  Server Error")
    }
}
const addingNewProduct = async(req,res)=>{
    try{
        const {name,Brand_name,category,price,stock,discount,description}=req.body;
        console.log(req.body);
        const files  = req.files;
        
        const product = new productModel({
            name,
            Brand_name,
            category,
            price,
            stock,
            discount,
            description,
            image: files.map(file => file.filename)
        })

        await product.save()
        res.redirect('/admin/productLists' );
    }catch(error){
        console.error(error);
        res.status(500).send("Internal  Server Error")
    }
}
const loadedit = async(req,res)=>{
    try{
        const id = req.params.id
        const pData =await productModel.find({_id:id});
        const category = await categorySchema.find({isAvailable:true});
        res.render('adminSide/admin-Editproducts',{category,pData})
    }catch(error){
        console.error(error);
        res.status(500).send("Internal  Server Error")
    
    }
}

const editProduct = async(req,res)=>{
    try{
        const {name,Brand_name,category,price,stock,discount,description}=req.body;
        const id = req.params.id;
        const data = req.body;
        // console.log(id,data);
        const files =req.files
        // console.log(req.body,id);
        const pData= await productModel.findByIdAndUpdate( id ,{
           $set:{
            name:name,
            Brand_name:Brand_name,
            category:category,
            price:price,
            stock:stock,
            discount:discount,
            description:description,
            image: files.map(file => file.filename)
           } 
        });
        
        console.log(pData);
        res.redirect('/admin/productLists')

    }catch(error){
        console.error(error);
        res.status(500).send("Internal  Server Error")
    }
}
const removeProduct = async(req,res)=>{
    try{
      const prroductId =req.body.productId  
      await productModel.findByIdAndUpdate({_id:prroductId},{
        isAvailable:false});
      res.json('success');
    }catch(error){
        console.error(error);
        res.status(500).send("Internal  Server Error")
    }

}


// Category Listing and Adding / edit / remove

const categoryList = async(req,res)=>{
    try{
        const category = await categorySchema.find();
        res.render('adminSide/admin-CategoriesList.ejs',{admin:req.session.admin,category:category});
    }catch(error){
        console.error(error);
        res.status(500).send("Internal  Server Error")
    }

}
const categoryAdding = async(req,res)=>{
    try{
        const {categoryName,description,discount}=req.body;
        const category = new categorySchema({
            categoryName,
            description,
            discount
        })
        await category.save()
        res.redirect('/admin/categoryList');
    }catch(error){
        console.error(error);
        res.status(500).send("Internal  Server Error")
    }
}
const categoryEdit = async (req,res)=>{
    try{
        const{ categoryName, description,discount,cataId}= req.body;
        const data = await categorySchema.findByIdAndUpdate({_id:cataId},{
            $set:{
                categoryName:categoryName,
                description:description,
                discount:discount
            }
        });
        const category = await categorySchema.find();
        res.redirect("/admin/categoryList");
        
    }catch(error){
        console.error(error);
        res.status(500).send("Internal  Server Error")
    }
}
const removeCategory = async(req,res)=>{
    try{


    }catch(error){
        console.error(error);
        res.status(500).send("Internal  Server Error")
    }
}
// Customers Listing / Add & block 

const customerList = async (req,res)=>{
    try{
        const userData = await User.find();

        res.render('adminSide/admin-Customers',{ userData});
    }catch(error){
        console.error(error);
        res.status(500).send("Internal  Server Error")
    }
}

const blockUser = async (req, res) => {
    try {
      const id = req.params.id;
      const {isBlocked}=req.body
console.log(typeof isBlocked);
 
    if (isBlocked === 'true') {
        await User.findByIdAndUpdate(id, { $set: { isBlocked: true } });
        console.log('Blocked');
      } else if (isBlocked === 'false') {
        await User.findByIdAndUpdate(id, { $set: { isBlocked: false } });
        console.log('Unblocked');
      }
    
      
      res.redirect('/admin/customerLists'); 
  
    } catch (error) {
      console.error(error);
      res.status(500).send("Internal Server Error");
    }
  };

const orderlist = async (req,res)=>{
    try{
        const Order = await orderModel.find().populate('userId', 'name');
        res.render('adminSide/admin-ordersList',{ Order})
    }catch (error) {
        console.error(error);
        res.status(500).send("Internal Server Error");
      }
};

const orderupdate = async (req, res) => {
    try {
        const orderId = req.body.orderId;
      const status = req.body.status;
      console.log(orderId, status); // Update to use req.body['delivered-status']
      const updatedOrder = await orderModel.findByIdAndUpdate(
        orderId,
        { status: status },
        { new: true }
      );
  
      if (!updatedOrder) {
        return res.status(404).json({ error: 'Order not found' });
      }
  
      
      res.json(updatedOrder);
    }
     catch (error) {
      console.error(error);
      res.status(500).send('Internal Server Error');
    }
  };
  
const couponList = async(req,res)=>{
    try{
        const coupons = await Coupon.find();
        res.render('adminSide/admin-Couponlist',{coupons});

    }catch (error) {
      console.error(error);
      res.status(500).send('Internal Server Error');
    }
}

const addCoupon = async(req,res)=>{
    try{
        const{couponName,couponValue,expiryDate,maxValue,minValue}=req.body
        console.log(req.body);
        const coupon = new Coupon({
           couponName,
           couponValue,
           expiryDate,
           maxValue,
           minValue,
        })
        await coupon.save();
        res.redirect('/admin/couponList')

    }catch(error){
        console.error(error);
        res.status(500).send("Internal  Server Error")
    }
}

const editCoupon = async(req,res)=>{
    try{
        const{couponName,couponValue,expiryDate,maxValue,minValue,couponId}=req.body;
        const data = await Coupon.findByIdAndUpdate({_id:couponId},{
            $set:{
                couponName,
                couponValue,
                maxValue,
                minValue,
                expiryDate,
            }
        });

        res.redirect('/admin/couponList')
    }catch(error){
        console.error(error);
        res.status(500).send("Internal  Server Error")
}
}

const removeCoupon = async (req, res) => {
  try {
    const couponId = req.body.couponId;

    // Delete the coupon from the database
    const deletedCoupon = await Coupon.findByIdAndDelete(couponId);

    if (!deletedCoupon) {
      return res.status(404).json({ error: 'Coupon not found' });
    }

    res.json({ message: 'Coupon deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
};

// Admin logout

const adminLogout = async(req,res)=>{
    try{
        req.session.admin = null;
        res.render('adminSide/admin-Logout')
    }catch(error){
        console.error(error);
        res.status(500).send("Internal  Server Error")
    }
}


module.exports={
    dashboard,
    adminLogin,
    adminVerify,
    productDetails,
    productLists,
    productAdding,
    loadedit,
    editProduct,
    removeProduct,
    categoryList,
    categoryAdding,
    customerList,
    blockUser,
    adminLogout,
    addingNewProduct,
    categoryEdit,
    orderlist,
    couponList,
    addCoupon,
    editCoupon,
    removeCoupon,
    orderupdate
}