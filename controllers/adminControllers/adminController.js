const admin =require('../../models/adminSchema');
const bcrypt = require("bcrypt");
const User = require('../../models/userSchema');
const productModel = require('../../models/productModel');
const categorySchema =require('../../models/categorySchema');
const orderModel = require('../../models/OderSchema');
const Coupon = require('../../models/couponSchema');
const Banner = require('../../models/bannarModel');
const sharp = require("sharp")
const path = require('path');
const ExcelJS = require('exceljs')
const PDFDocument =require('pdfkit')
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
const dashboard = async (req, res) => {
    try {
      // Fetch data for the dashboard
      const totalUsers = await User.countDocuments();
      const totalOrders = await orderModel.countDocuments();
      const totalEarnings = await orderModel.aggregate([
        {
          $group: {
            _id: null,
            total: { $sum: { $toDouble: "$payment.amount" } },
          },
        },
      ]);
      
      // If there are no orders, the totalEarnings array will be empty
      // In that case, set the totalEarningsAmount to 0
      const totalEarningsAmount = totalEarnings.length > 0 ? totalEarnings[0].total : 0;
      
      
      const totalRefunds = await orderModel.aggregate([
        { $match: { orderReturnRequest: true } },
        {
          $group: {
            _id: null,
            total: { $sum: { $toDouble: "$payment.amount" } },
          },
        },
      ]);
  
      // If there are no orders with refund requests, the totalRefunds array will be empty
      // In that case, set the totalRefundAmount to 0
      const totalRefundAmount = totalRefunds.length > 0 ? totalRefunds[0].total : 0;
  
    
      const mostSoldBrands = await orderModel.aggregate([
        { $unwind: "$products" },
        { $group: { _id: "$products.p_name", count: { $sum: "$products.quantity" } } },
        { $sort: { count: -1 } },
        { $limit: 5 } // Get the top 5 most sold brands
      ]);
  

      

      // Extract the brand names from the mostSoldBrands data
      const brandNames = mostSoldBrands.map(brand => brand._id);
      const mostSoldCategories = await orderModel.aggregate([
        { $unwind: "$products" },
        { $group: { _id: "$products.category", count: { $sum: "$products.quantity" } } },
        { $sort: { count: -1 } },
        { $limit: 5 }, // Get the top 5 most sold categories
      ]);
  
      // Extract the category names and counts from the mostSoldCategories data
      const categoryCounts = mostSoldCategories.map(category => ({ category: category._id[0], count: category.count }));
  

     
      const orderConversionRatio = totalUsers > 0 ? (totalOrders / totalUsers) * 100 : 0;
     
  
      // Pass the dynamic data to the view
      res.render('adminSide/Dashboard', {
        totalUsers,
        totalOrders,
        totalEarningsAmount,
        totalRefundAmount,
        mostSoldBrands,
        brandNames,
        totalRefunds,
        orderConversionRatio
      });
    } catch (error) {
      console.error(error);
      res.status(500).send("Internal Server Error");
    }
  };
  const ChartData = async (req, res) => {
    try {
      // Fetch total earnings based on month
      const labels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const totalEarnings = await orderModel.aggregate([
        { 
          $match: { status: "Delivered" } // Match only delivered orders
        },
        {
          $group: { 
            _id: { $month: "$createdAt" }, 
            total: { $sum: { $toInt: "$payment.amount" } } // Convert string to integer
          } 
        },
        {
          $sort: {
            _id: 1
          }
        }
      ]); 
      const earningsByMonth = Array.from({ length: 12 }, () => 0);
  
      totalEarnings.forEach(monthData => {
        const monthIndex = monthData._id - 1;
        earningsByMonth[monthIndex] = monthData.total;
      });
      
      // Send the earnings data as a JSON response
      res.json({
        labels,earningsByMonth,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  };
// Product Listing and details
const salesReport = async (req, res) => {
  try {
    const reportType = req.body.reportType;
    const fileFormat = req.body.fileFormat;
    const sortby = req.body.sortOption

    console.log(reportType, fileFormat,sortby);

    const orders = await orderModel.find({status:'Delivered'}).populate("products userId")
    // .exec(); // Make sure to use .exec() to execute the query

    if (fileFormat === "pdf") {
      const doc = new PDFDocument();

      const tableHeaderStyle = {
        fontSize: 14,
        bold: true,
      };

      const tableContentStyle = {
        fontSize: 10,
      };

      let yPos = 100;

      // Drawing the starting horizontal line
      doc.moveTo(50, yPos).lineTo(500, yPos).stroke();

      yPos += 5;

      doc.font("Helvetica-Bold").fontSize(12);
      doc.text("Order ID", 50, yPos, { continued: true });
      doc.text("Customer Name", 150, yPos);
      doc.text("Total Amount", 400, yPos);

      yPos += 20; // Increase the vertical position after the table headers

      doc.font("Helvetica").fontSize(10);
      orders.forEach((order) => {
        doc.text(order._id.toString(), 50, yPos, { continued: true });
        doc.text(order.userId.name, 150, yPos);
        doc.text(order.payment.amount, 400, yPos);

        doc
          .moveTo(50, yPos + 15)
          .lineTo(500, yPos + 15)
          .stroke();
        yPos += 25;

        doc
          .moveTo(50, yPos - 50)
          .lineTo(50, yPos)
          .stroke();
        doc
          .moveTo(200, yPos - 50)
          .lineTo(200, yPos)
          .stroke();
        doc
          .moveTo(400, yPos - 50)
          .lineTo(400, yPos)
          .stroke();

        doc
          .moveTo(500, yPos - 50)
          .lineTo(500, yPos)
          .stroke();
      });

      doc.end();

      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        "attachment; filename=sales_report.pdf"
      );

      doc.pipe(res);
    } else if (fileFormat === "excel") {
      // Generate Excel report
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet("Sales Report");

      // Set the column headers
      worksheet.columns = [
        { header: "Order ID", key: "_id", width: 30 },
        { header: "Date", key:"createdAt", width: 30 },
        { header: "Customer Name", key: "user.name", width: 30 },
        { header: "Total Amount", key: "totalPrice", width: 15 },
        { header: "Payment Method", key: "paymentMethod", width: 15 },
      ];

      // Add data rows to the worksheet
      orders.forEach((order) => {
        worksheet.addRow({
          _id: order._id.toString(),
          createdAt: order.createdAt.toLocaleDateString(),
          "user.name": order.userId.name,
          totalPrice: order.payment.amount.toString(),
          paymentMethod: order.payment.method.toString(),
        });
      });

      // Generate the Excel file buffer
      const excelBuffer = await workbook.xlsx.writeBuffer();

      // Set the appropriate headers for file download
      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      );
      res.setHeader(
        "Content-Disposition",
        "attachment; filename=sales_report.xlsx"
      );

      // Send the generated Excel file as the response
      res.send(excelBuffer);
    } else {
      throw new Error("Invalid file format");
    }
  } catch (error) {
    console.log(error.message);
    res.status(500).send("Internal Server Error");
  }
};
const productLists = async (req, res)=>{
    try{
        const product = await productModel.find();
        // Fetch all categories
    const categories = await categorySchema.find();

    // Merge category name into each product based on category ID
    const productsWithCategory = product.map((product) => {
      const category = categories.find((cat) => cat._id.toString() === product.category.toString());
      return {
        ...product.toObject(),
        categoryName: category ? category.categoryName : '', // Add categoryName property to the product object
      };
    });
        res.render('adminSide/admin-ProductsList',{title : "Product",admin:req.session.admin,  product: productsWithCategory});
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
        
        const category = await categorySchema.find();
        res.render('adminSide/admin-Addproducts',{category});
    }catch(error){
        console.error(error);
        res.status(500).send("Internal  Server Error")
    }
}
const addingNewProduct = async(req,res)=>{
    try{
        const {name,Brand_name,category,price,stock,discount,description,}=req.body;
        const files  = req.files;
        const originalPrice = parseFloat(price);
    const discountPercentage = parseFloat(discount);
    const discountedPrice = originalPrice - (originalPrice * (discountPercentage / 100));
        
    const imagePaths = [];

    for (const image of files) {
      const imagePath = image.path;
      const croppedImagePath = imagePath.replace(
        /(\.[\w\d_-]+)$/i,
        "-cropped$1"
      );
      await sharp(imagePath).resize(1500, 1500).toFile(croppedImagePath);

      // Get the filename without the path and push it to the imagePaths array
   const imageName = path.basename(croppedImagePath);
   imagePaths.push(imageName);
     }
        const product = new productModel({
            name,
            Brand_name,
            category,
            price,
            stock,
            discount,
            description,
            discountedPrice,
            image: imagePaths
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
        const files =req.files
        const originalPrice = parseFloat(price);
        const discountPercentage = parseFloat(discount);
        const discountedPrice = originalPrice - (originalPrice * (discountPercentage / 100));

        const imagePaths = [];

    for (const image of files) {
      const imagePath = image.path;
      const croppedImagePath = imagePath.replace(
        /(\.[\w\d_-]+)$/i,
        "-cropped$1"
      );
      
      await sharp(imagePath).resize(1500, 1500).toFile(croppedImagePath);

      // Get the filename without the path and push it to the imagePaths array
   const imageName = path.basename(croppedImagePath);
   imagePaths.push(imageName);
     }
        const pData= await productModel.findByIdAndUpdate( id ,{
           $set:{
            name:name,
            Brand_name:Brand_name,
            category:category,
            price:price,
            stock:stock,
            discount:discount,
            description:description,
            discountedPrice: discountedPrice,
            image: imagePaths
           } 
        });
        
        
        res.redirect('/admin/productLists')

    }catch(error){
        console.error(error);
        res.status(500).send("Internal  Server Error")
    }
}
const removeProduct = async(req,res)=>{
    try{
      const productId =req.body.productId 
     const productdata = await productModel.findOne({_id:productId});
     if(productdata.isAvailable){
      await productModel.findByIdAndUpdate({_id:productId},{
        isAvailable:false});
      }else{
        await productModel.findByIdAndUpdate({_id:productId},{
          isAvailable:true});
      }
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
        const cataId = req.params.id;
        const category = categorySchema.findByIdAndUpdate(cataId,{isAvailable:false},{new:true})
        if(!category){
            return res.status(404).json({ error: 'Category not found' });
        }

        res.json(category);
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
         // Sort orders by date in descending order (recent first)
         Order.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
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
       // Update to use req.body['delivered-status']
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
    console.log(couponId);

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

const banner = async (req,res)=>{
    try {
        const banner = await Banner.find();
        res.render('adminSide/admin-Bannar',{banner})
    }catch (error){
        console.error(error);
        res.status(500).send('Internal Server Error'); 
    }
}
const addBanner = async(req,res)=>{
    try{
       const {BannerName,description,description2}=req.body 
       const images = req.files;
       const imagePaths = [];

       for (const image of images) {
         const imagePath = image.path;
         const croppedImagePath = imagePath.replace(
           /(\.[\w\d_-]+)$/i,
           "-cropped$1"
         );
         
         await sharp(imagePath).resize(2560, 800).toFile(croppedImagePath);
   
         // Get the filename without the path and push it to the imagePaths array
      const imageName = path.basename(croppedImagePath);
      imagePaths.push(imageName);
       }
       
       const banner= new Banner({
        BannerName,
        description,
        description2,
        image: imagePaths,
       })
       await banner.save();
       
       res.redirect('/admin/bannarlist')
    }catch (error){
        console.error(error);
        res.status(500).send('Internal Server Error'); 
    }
}

const editBanner = async(req,res)=>{
    try{
        const {BannerName,description,description2,bannerId}=req.body
        const images = req.files;
        const imagePaths = [];

        for (const image of images) {
          const imagePath = image.path;
          
          const croppedImagePath = imagePath.replace(
            /(\.[\w\d_-]+)$/i,
            "-cropped$1"
          );
         
          await sharp(imagePath).resize(2560, 800).toFile(croppedImagePath);
    
          // Get the filename without the path and push it to the imagePaths array
       const imageName = path.basename(croppedImagePath);
       imagePaths.push(imageName);
        }
        
        
        const data = await Banner.findByIdAndUpdate({_id:bannerId},{
            $set:{
            BannerName,
            description,
            description2,
            image: imagePaths,
            }
        });
        res.redirect('/admin/bannarlist')
    }catch (error){
        console.error(error);
        res.status(500).send('Internal Server Error'); 
    }
}

const hideBanner = async (req, res) => {
    try {
      const id = req.query.id;
     
      const bannerData = await Banner.findOne({ _id: id });
      if (bannerData.is_active) {
        await Banner.findByIdAndUpdate({ _id: id }, { $set: { is_active: 0 } }); console.log("hidden");
      }
      else { await Banner.findByIdAndUpdate({ _id: id }, { $set: { is_active: 1 } }); console.log("unhidden"); }
      res.redirect('/admin/bannarlist')
    } catch (error) {
      console.log(error.message);
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
    ChartData,
    salesReport,
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
    orderupdate,
    removeCategory,
    banner,
    addBanner,
    editBanner,
    hideBanner,
}