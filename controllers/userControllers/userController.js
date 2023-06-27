const User = require("../../models/userSchema");
const bcrypt = require("bcrypt");
const products = require("../../models/productModel");
require("dotenv");
const fast2sms = require("../../confg/fast2sms-config");

// const Sms  = require("../../middleware/SmsVarification");
// Twilio

// HOME RENDERING
const home = async (req, res) => {
  try {
    res.render("userSide/Home");
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal  Server Error");
  }
};

const login = async (req, res) => {
  try {
    res.render("userSide/userLogin");
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal  Server Error");
  }
};

//  const otp = (req,res)=>{
//    res.render('userSide/otp')
//  }
const securePassword = async (password) => {
  try {
    const passwordHash = await bcrypt.hash(password, 10);
    return passwordHash;
  } catch (error) {
    console.log(error.message);
  }
};
let user;
const Signup = async (req, res) => {
  try {
    const { name, email, number } = req.body;
    const password = await securePassword(req.body.password);
    console.log(req.body);
    user = new User({
      name,
      email,
      number,
      password,
    });
    if (!email || !name || !password || !number) {
      return res.status(400).send("All fields are required");
    }
     const otp = Math.floor(1000 + Math.random() * 9000);
   
    // Fast2sms config
    fast2sms
      .sendMessage({
        authorization:
          "MmiGSpB20ev9fNcuVWXQ1TKjsE3AF5oxP8CwLygtZOYdHkaznIacfJgFCWdENAOwYPho7RIjkipQrutl", // Replace with your actual API key
        message: `Your verification OTP is: ${otp}`,

        numbers: [number],
      })
      .then((response) => {
        console.log("OTP sent successfully", response);
        console.log(otp);
        // Save the OTP in session or database for verification in the next step
        req.session.otp = otp;
        // Redirect the user to the verify OTP page
        res.render("userSide/otp");
      })
      .catch((error) => {
        console.error("Failed to send OTP", error);
        // Handle error and display appropriate message to the user
      });
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal  Server Error");
  }
};

const verifyOtp = async (req, res) => {
  try {
    const num1 = req.body.one;
    const num2 = req.body.two;
    const num3 = req.body.three;
    const num4 = req.body.four;
    const code = parseInt(num1 + num2 + num3 + num4);
    console.log(code);
    if (code === req.session.otp) {
      delete req.session.otp;
      await user.save();
      res.redirect("/login");
    } else {
      res.send("please enter a valid OTP");
    }
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal  Server Error");
  }
};

const verifyLogin = async (req, res) => {
  try {
    const email = req.body.email;
    const password = req.body.password;
    console.log(email, password);

    const userData = await User.findOne({ email: email });
    console.log("user:" + userData);
    if (userData) {
      const passwordMatch = await bcrypt.compare(password, userData.password);
      console.log(passwordMatch);
      if (passwordMatch) {
        req.session.user = userData._id;
        req.session.email = userData.email;
        res.redirect("/");
      } else {
        res.render("userSide/userLogin", {
          message: "email and password are incorrect",
        });
      }
    } else {
      res.render("userSide/userLogin", {
        message: "email and password are incorrect",
      });
    }
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal  Server Error");
  }
};

const userLogout = async (req, res) => {
  try {
    req.session.user = null;
    req.session.user = 0;
    res.redirect("/login");
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal  Server Error");
  }
};

// Product List

// const productList = async(req,res)=>{
//    try {
//       const categoryData = await Category.find()
//       let {search,sort,category,limit,page,ajax}=req.query
//       if(!search){
//          search = ''
//       }
//       skip = 0
//       if(!limit){
//          limit =15
//       }
//       if(!page){
//          page = 0

//       }
//       skip = page*limit
//        let arr = []
//        if(category){
//          for(i=0;i<category.length;i++){
//             arr=[...arr,category[category[i]].name]
//          }
//        }else{
//          category =[]
//          arr = categoryData.map((x)=>{
//             if(x.is_available===1){
//                return x.name
//             }
//          });

//        }
//        if (sort == 0) {
//          productData = await products.find({ $and: [{ category: arr }, { $or: [{ name: { $regex: '' + search + ".*" } }, { category: { $regex: ".*" + search + ".*" } }] },{isAvailable:1}] }).sort({ $natural: -1 })
//          pageCount = Math.floor(productData.length / limit)
//          if (productData.length % limit > 0) {

//              pageCount += 1
//          }

//          productData = await products.find({ $and: [{ category: arr }, { $or: [{ name: { $regex: '' + search + ".*" } }, { category: { $regex: ".*" + search + ".*" } }] },{isAvailable:1}] }).sort({ $natural: -1 }).skip(skip).limit(limit)
//      } else {
//          productData = await products.find({ $and: [{ category: arr }, { $or: [{ name: { $regex: '' + search + ".*" } }, { category: { $regex: ".*" + search + ".*" } }] }] }).sort({ price: sort })
//          pageCount = Math.floor(productData.length / limit)
//          if (productData.length % limit > 0) {
//              pageCount += 1
//          }

//          productData = await products.find({ $and: [{ category: arr }, { $or: [{ name: { $regex: '' + search + ".*" } }, { category: { $regex: ".*" + search + ".*" } }] }] }).sort({ price: sort }).skip(skip).limit(limit)
//      }

//      if (req.session.user) { session = req.session.user } else session = false
//      if (pageCount == 0) { pageCount = 1 }
//      if (ajax) {
//          res.json({ products: productData, pageCount, page })
//      } else {
//          res.render('userSide/productList', { user: session, product: productData, category: categoryData, val: search, selected: category, order: sort, limit: limit, pageCount, page })
//      }
//     } catch(error){
//       console.error(error);
//    res.status(500).send("Internal  Server Error")
//    }
// }

// Product Details

const productList = async (req, res) => {
  try {
    const product = await products.find();
    console.log(product);
    res.render("userSide/productList", { product });
  } catch (error) {
    console.log("objec" + error);
  }
};

const productDetails = async (req, res) => {
  try {
    const id = req.params.id;
    const productDetails = await products.find({ _id: id });
    const productDetail = await products.findOne({ _id: id });
    console.log(productDetails);
    //  const product = await products.find({ category: details.category });
    res.render("userSide/productDetails", {
      user: req.session.user,
      productDetails,
      productDetail,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal  Server Error");
  }
};

//  EXPORTING
module.exports = {
  home,
  login,
  Signup,
  productList,
  productDetails,
  verifyLogin,
  userLogout,
  verifyOtp,
};
