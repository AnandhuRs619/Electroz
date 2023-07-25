const User = require("../../models/userSchema");
const bcrypt = require("bcrypt");
const products = require("../../models/productModel");
require("dotenv");
const fast2sms = require("../../confg/fast2sms-config");
const productModel = require("../../models/productModel");
const orderModel = require("../../models/OderSchema");
const Coupon = require("../../models/couponSchema");
const Category = require("../../models/categorySchema");
const Razorpay = require('razorpay');

//  Razorpoy
const key_id = process.env.RAZORPAY_API_Id
const key_secret = process.env.RAZORPAY_API_Key
const razorpay = new Razorpay({
  key_id:"rzp_test_tfaNKW9QlZ9Yp9", // Replace with your actual Razorpay test key
  key_secret: "OVrPNai520EfZTw0ROQySCN7", // Replace with your actual Razorpay test secret
});

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
    const userData = await User.findOne({ email: email });
    if (userData) {
      const passwordMatch = await bcrypt.compare(password, userData.password);
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
// Password Resetting using otp
const forgotpassword = async (req, res) => {
  try {
    res.render("userSide/forgotPassword");
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal  Server Error");
  }
};

const sendOtp = async (req, res) => {
  const phoneNumber = req.body.phone;
  // otp generate
  const otp = Math.floor(1000 + Math.random() * 9000);

  fast2sms
    .sendMessage({
      authorization:
        "MmiGSpB20ev9fNcuVWXQ1TKjsE3AF5oxP8CwLygtZOYdHkaznIacfJgFCWdENAOwYPho7RIjkipQrutl", // Replace with your actual API key
      message: `Your verification OTP is: ${otp}`,
      phoneNumber,
    })

    .then((response) => {
      // Store the OTP and phone number in session or database for verification
      req.session.phone = phoneNumber;
      req.session.otp = otp;

      res.redirect("/forgot-password/verify-otp");
    })
    .catch((error) => {
      console.error(error);
      res.status(500).send("Failed to send OTP. Please try again later.");
    });
};

const verifyotp = async (req, res) => {
  try {
    const otp = req.body.otp;
    const { phone, otp: storedOtp } = req.session;

    if (otp === storedOtp) {
      res.redirect("/forgot-password/reset-password");
    } else {
      req.status(400).send("Invalid OTP Please try again.");
    }
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal  Server Error");
  }
};

const resetPassword = async (req, res) => {
  const password = req.body.password;
  const password2 = req.body.password2;
  const phone = req.session.phone;

  if (password === password2) {
    User.upatePassword(phone, password)

      .then(() => {
        // Clear the session
        req.session.destroy();
        res.redirect("/forgot-password/reset-password-successful");
      })
      .catch((error) => {
        console.error(error);
        res
          .status(500)
          .send("Failed to update password. Please try again later.");
      });
  } else {
    res.status(400).send("Passwords do not match. Please try again.");
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
const productList = async (req, res) => {
  try {
    const productPerPage = 9;
    const page = parseInt(req.query.page) || 1;

    const [totalProduct, product, categories] = await Promise.all([
      productModel.find({ isAvailable: true }),
      productModel.find({ isAvailable: true }).skip((page - 1) * productPerPage).limit(productPerPage),
      Category.find({ isAvailable: true }),
    ]);

    const totalPages = Math.ceil(totalProduct.length / productPerPage);

    const categoryCountMap = await productModel.aggregate([
      { $match: { isAvailable: true } },
      { $group: { _id: "$category", count: { $sum: 1 } } },
    ]).then((data) => Object.fromEntries(data.map((categoryData) => [categoryData._id, categoryData.count])));

    const brandCountMap = await productModel.aggregate([
      { $group: { _id: "$Brand_name", count: { $sum: 1 } } },
    ]).then((data) => Object.fromEntries(data.map((brandData) => [brandData._id, brandData.count])));

    const productsWithCategory = product.map((prod) => {
      const category = categories.find((cat) => cat._id.toString() === prod.category.toString());
      return {
        ...prod.toObject(),
        categoryName: category ? category.categoryName : '',
      };
    });

    const brands = await productModel.distinct('Brand_name');

    res.render("userSide/productList", {
      product: productsWithCategory,
      category: categories,
      totalPages,
      totalProduct,
      page,
      productPerPage,
      brands,
      productCountPerBrand: brandCountMap,
      productCountPerCategory: categoryCountMap,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
};

const productDetails = async (req, res) => {
  try {
    const id = req.params.id;
    const productDetails = await products.find({ _id: id });
    const productDetail = await products.findOne({ _id: id });
      // Merge category name into each product based on category ID
      const categories = await Category.find();
    const category = categories.find((cat) => cat._id.toString() === productDetail.category.toString());
    productDetail.categoryName = category ? category.categoryName : '';

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
const Cart = async (req, res) => {
  try {
    const userId = req.session.user;
    const userDetails = await User.findById(userId).populate(
      "cart.items.productId"
    );
    
    const user = await User.findById(userId)
    const coupons = await Coupon.find();
    if (!userDetails || !userDetails.cart) {
      // Handle the scenario when cart data is missing or user details are not found
      return res.status(404).send("Cart data not found");
    }
    
    const selectedCouponValue = parseInt(req.body.selectedCouponValue); // Get the selected coupon's discount value from the frontend

    let subtotal=user.subtotal;
    let totalCategoryDiscountAmount = 0; // Initialize the total category discount amount

    for (const product of userDetails.cart.items) {
      // Calculate the total price of each product based on its quantity
      const productPrice = parseInt(product.productId.discountedPrice) * product.quantity;
      // totalAmount += productPrice;

      // Fetch the category discount for the current product
      const category = await Category.findOne({ categoryName: product.productId.category });

      // Calculate the category discount amount for the current product based on percentage
      const categoryDiscountPercentage = category ? category.discount : 0;
      const categoryDiscountAmount = (productPrice * categoryDiscountPercentage) / 100;

      // Add the category discount amount to the total
      totalCategoryDiscountAmount += categoryDiscountAmount;
    }

    let discountAmount = 0;
    let discountedTotalAmount = subtotal;

    // if (selectedCouponValue > 0) {
    //   // If a coupon is selected, apply the discount
    //   discountAmount = selectedCouponValue;
    //   discountedTotalAmount = subtotal - discountAmount ;
    // }

    // Calculate shipping charge
    const shippingCharge = 100.00;

    // Calculate final amount including shipping charge
    const finalAmount = discountedTotalAmount + shippingCharge - totalCategoryDiscountAmount;

    const cartItems = userDetails.cart.items;
    res.render("userSide/Cart", { user,cartItems, coupons, discountAmount, shippingCharge, finalAmount, totalCategoryDiscountAmount });
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
};
const searchProduct = async (req, res) => {
  try {
    const user = req.session._id;
    const search = req.body.search;
    console.log(search);
    const searchPattern = new RegExp(search, "i");
    const searchedProducts = await productModel.find({ name: searchPattern }).exec();
    const searchedProductIds = searchedProducts.map((product) => product._id);

    const otherProducts = await productModel.find({
      _id: { $nin: searchedProductIds },
    }).exec();

    const products = searchedProducts;
    res.json(products);
  } catch (error) {
    console.log(error.message);
    res.status(500).send("Internal Server Error");
  }
}

const cartAdding = async (req, res) => {
  try {
    const Id = req.body.productId;
    const userId = req.session.user;
    const userDetails = await User.findById({ _id: userId });
    const cart = userDetails.cart.items;
    const existingCartItem = cart.find((items) => items.productId == Id);
    const product = await productModel.findById({ _id: Id });
    const productPrice = parseInt(product.discountedPrice);
    if (existingCartItem) {
      existingCartItem.quantity += 1;
      existingCartItem.price = existingCartItem.quantity * productPrice;
    } else {
      const newCartItem = {
        productId: Id,
        quantity: 1,
        price: productPrice,
        realPrice: product.discountedPrice,
      };
      userDetails.cart.items.push(newCartItem);
    }
    await userDetails.save();
    res.json("successfully Added Your Cart");
  } catch (error) {
    console.log(error);
  }
};

const cartRemove = async (req, res) => {
  try {
    const userId = req.session.user;
    const productId = req.params.itemId;
    const user = await User.findById(userId);

    console.log(productId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Find the index of the item in the cart items array with the matching productId
    const itemIndex = user.cart.items.findIndex((item) => item.productId.toString() === productId);

    if (itemIndex === -1) {
      return res.status(404).json({ error: 'Product not found in cart' });
    }

   
    user.cart.items.splice(itemIndex, 1);

  
    await user.save();

    res.json({ success: true, message: 'Product removed from cart successfully' });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const cartOuantity = async (req, res) => {
  try {
    const userId = req.session.user;
    const productId = req.params.productId;
    const { quantity } = req.body;

    // Find the user and update the product quantity in the cart
    const user = await User.findById(userId);
      console.log(productId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Find the product in the cart items array
    const cartItem = user.cart.items.find(item => item.productId.toString() === productId);

    if (!cartItem) {
      return res.status(404).json({ error: 'Product not found in cart' });
    }

    // Update the quantity of the product in the cart
    cartItem.quantity = quantity;

    // Save the updated user document
    await user.save();

    res.json(user.cart.items);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
};
const checkout = async (req, res) => {
  try {
    const userId = req.session.user;
    const userDetails = await User.findById(userId).populate(
      "cart.items.productId"
    );
    const user = await User.findById(userId)
    if (!userDetails || !userDetails.cart) {
      // Handle the scenario when cart data is missing or user details are not found
      return res.status(404).send("Cart data not found");
    }

    // Calculate total amount and total category discount amount
    let totalAmount = 0;
    let totalCategoryDiscountAmount = 0;

    for (const product of userDetails.cart.items) {
      const productPrice = parseInt(product.productId.discountedPrice) * product.quantity;
      totalAmount += productPrice;

      const category = await Category.findOne({ categoryName: product.productId.category });
      const categoryDiscountPercentage = category ? category.discount : 0;
      const categoryDiscountAmount = (productPrice * categoryDiscountPercentage) / 100;
      totalCategoryDiscountAmount += categoryDiscountAmount;
    }

    // Apply coupon discount if applicable
    const selectedCouponValue = parseInt(req.body.selectedCouponValue);
    let discountAmount = 0;

    if (selectedCouponValue > 0) {
      discountAmount = selectedCouponValue;
    }

    // Calculate shipping charge
    const shippingCharge = 100.00;

    // Calculate final amount including shipping charge and all discounts
    const discountedTotalAmount = totalAmount - discountAmount - totalCategoryDiscountAmount;
    const finalAmount = discountedTotalAmount + shippingCharge;

    const address = userDetails.address;
    const cartItems = userDetails.cart.items;
    res.render("userSide/Checkout", { user,cartItems, address, totalAmount, discountAmount, finalAmount, shippingCharge, totalCategoryDiscountAmount });
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
};

const coupon = async (req, res) => {
  try {
    const userId = req.session.user;
    const selectedCouponValue = req.body.selectedCouponValue;
    const totalAmount = req.body.totalAmount;
    console.log(req.body);
    const user = await User.findById(userId);
  
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const couponValue = await Coupon.findOne({ couponName: selectedCouponValue });
    if (!couponValue) {
      return res.status(404).json({ message: "Coupon not Found" });
    }

    // const date = new Date();
    // const newDate = date.toLocaleDateString();
    // const expiryDate = couponValue.expiryDate;
    // if (expiryDate < newDate) {
    //   return res.status(400).json({ message: 'Coupon has expired' });
    // }

    // if (totalAmount < couponValue.minValue) {
    //   return res.status(400).json({ message: 'Total amount is not within the valid range for this coupon' });
    // }

    const discountAmount = couponValue.couponValue;
    console.log(discountAmount);
    const finalAmount = user.subtotal - discountAmount;

    console.log(finalAmount);
    await User.findOneAndUpdate({_id:userId},{subtotal:finalAmount})
    
    res.json({ finalAmount,discountAmount
     });
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
};

const userProfile = async (req, res) => {
  try {
    const userId = req.session.user;
    const userDetails = await User.findById({ _id: userId });
    const userAddress = userDetails.address;
    res.render("userSide/UserProfile", {
      userDetails: {
        name: userDetails.name,
        email: userDetails.email,
      },
      userAddress: userAddress,
    });
  } catch (error) {
    console.log(error);
  }
};

const Myprofile = async (req,res)=>{
  try{
    const userId = req.session.user;
    userDetails = await User.findById({_id:userId});

    res.render("userSide/Myprofile",{userDetails});
  }catch (error) {
    console.log(error);
  }
}

const editProfile = async(req,res)=>{
  try {
    const userId = req.session.user;
    const { name, number } = req.body;

    // Find the user by their ID and update the fields
    const user = await User.findByIdAndUpdate(userId, {
      $set: { name: name, number: number },
    });

    // Save the updated user
    await user.save();

    // Send a response indicating the update was successful
    return res.status(200).json({ message: "Profile updated successfully" });
  } catch (error) {
    console.log(error);
    // Handle any errors that occurred during the update process
    return res.status(500).json({ message: "Internal server error" });
  }
};
const profileOtp = async (req, res) => {
  try {
    const userId = req.session.user;
    const { number } = req.body;
    const otp = Math.floor(1000 + Math.random() * 9000);

    // Fast2sms config
    fast2sms
      .sendMessage({
        authorization:"MmiGSpB20ev9fNcuVWXQ1TKjsE3AF5oxP8CwLygtZOYdHkaznIacfJgFCWdENAOwYPho7RIjkipQrutl", // Replace with your actual API key
        message: `Your verification OTP is: ${otp}`,
        numbers: [number],
      })
      .then((response) => {
        console.log("OTP sent successfully", response);
        console.log(otp);
        // Save the OTP in session or database for verification in the next step
        req.session.otp = otp;
        res.status(200).json({ message: "OTP sent successfully" });
      })
      .catch((error) => {
        console.error("Failed to send OTP", error);
        res.status(500).json({ message: "Failed to send OTP" });
      });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const paswordChange = async (req,res)=>{
  try{
    const userId = req.body.user;
    const user =await User.findById(userId);
    const number = user.number;
    const otp = Math.floor(1000 + Math.random() * 9000);

    // Fast2sms config
    fast2sms
      .sendMessage({
        authorization:"MmiGSpB20ev9fNcuVWXQ1TKjsE3AF5oxP8CwLygtZOYdHkaznIacfJgFCWdENAOwYPho7RIjkipQrutl", // Replace with your actual API key
        message: `Your verification OTP is: ${otp}`,
        numbers: [number],
      })
      .then((response) => {
        console.log("OTP sent successfully", response);
        console.log(otp);
        // Save the OTP in session or database for verification in the next step
        req.session.otp = otp;
        res.status(200).json({ message: "OTP sent successfully" });
      })
      .catch((error) => {
        console.error("Failed to send OTP", error);
        res.status(500).json({ message: "Failed to send OTP" });
      });
  }catch(error){
    console.log(error);
    res.status(500).json({ message: "Internal server error" });
  }
}
const changePassword = async (req, res) => {
  try {
    const { otp, newPassword } = req.body;
    const password = await securePassword(newPassword);
    console.log(password);
    console.log(typeof password);
    // Verify the OTP
    const storedOTP = req.session.otp;
    console.log("njan varuthan"+otp);
    console.log("njan evida ull ala"+storedOTP);
    if (otp !== storedOTP.toString()) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    // Update the user's password
    const userId = req.session.user;
    const user = await User.findById(userId);
    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }

    user.password = password;
    await user.save();

    // Clear the OTP from the session
    delete req.session.otp;

    // Send a response indicating the password was changed successfully
    res.status(200).json({ message: "Password changed successfully" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal server error" });
  }
};
const addAddress = async (req, res) => {
  try {
    const userId = req.session.user;
    const { name, addressline, street, city, state, phone, country, postCode } =
      req.body;

    // Assuming you have a User model defined
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    console.log(req.body);
    // Create a new address object
    const newAddress = {
      name,
      addressline,
      street,
      city,
      state,
      phone,
      country,
      postCode,
    };

    // Push the new address to the user's address array
    user.address.push(newAddress);

    // Save the updated user
    await user.save();

    res.redirect("/profile");
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Server error" });
  }
};

const editAddress = async (req, res) => {
  try {
    const userId = req.session.user;
    const {
      addressId,
      name,
      addressline,
      street,
      city,
      state,
      phone,
      postCode,
      country,
    } = req.body;
    const user = await User.findById(userId);

    // Find the index of the address within the user's address array
    const addressIndex = user.address.findIndex(
      (item) => item._id.toString() === addressId
    );

    // Update the properties of the address object
    user.address[addressIndex].name = name;
    user.address[addressIndex].addressline = addressline;
    user.address[addressIndex].street = street;
    user.address[addressIndex].city = city;
    user.address[addressIndex].state = state;
    user.address[addressIndex].phone = phone;
    user.address[addressIndex].postCode = postCode;
    user.address[addressIndex].country = country;

    await user.save();
    res.redirect("/profile");
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Server error" });
  }
};

const myWishlist = async (req, res) => {
  try {
    const userId = req.session.user;
    const user = await User.findById(userId);
    const productData = user.wishlist;
    const productId = productData.map((items) => items.productId);
    const productDetails = await productModel.find({ _id: { $in: productId } });
    res.render('userSide/MyWishlist', { productDetails });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const addToWishlist = async (req, res) => {
  try {
    const userId = req.session.user;
    const { name, id } = req.body;
    console.log(req.body);
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    // Check if the product already exists in the wishlist
    const productExists = user.wishlist.some((item) => item.productId.toString() === id);
    if (productExists) {
      return res.status(400).json({ message: 'Product already exists in the wishlist' });
    }
    const wishlistItem = {
      productId: id
      
    };
    user.wishlist.push(wishlistItem);
     await user.save();

    // Return a success response
    res.status(200).json({ message: 'Product added to wishlist successfully' });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const myOrder = async (req, res) => {
  try {
    const userId = req.session.user;
    const user = await User.findById(userId);
    const userOrder = await orderModel.find({ userId: userId });

    if (!user || !userOrder) {
      return res.status(404).send("User or order not found");
    }

    const addresses = user.address;
    const orderWithAddress = userOrder.map((order) => {
      const address = addresses.find((addr) => addr._id.toString() === order.address.toString());
      return {
        ...order.toObject(),
        name: address ? address.name : '',
      };
    });

    // Sort orders by date in descending order (recent first)
    orderWithAddress.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.render("userSide/Myorder", { userOrder: orderWithAddress });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Server error" });
  }
};


const order = async (req, res) => {
  try {
    const userId = req.session.user;
    console.log(req.body);
    const { shippingAddress, paymentMethod,finalAmount } = req.body;
    const user = await User.findById(userId);

    const productIds = user.cart.items.map((product) => {
      return {
        productId: product.productId,
        quantity: product.quantity,
        price: product.price,
      };
    });

    const selectedAddress = user.address.find((address) => address._id.toString() === shippingAddress);
    if (!selectedAddress) {
      return res.status(400).json({ message: 'Invalid shipping address' });
    }
    const selectedAdd = selectedAddress._id;

    const products = await Promise.all(
      productIds.map(async (item) => {
        const productData = await productModel.findById(item.productId);
        if (productData) {
          return {
            p_id: productData._id,
            p_name: productData.name,
            price: item.price,
            image: productData.image,
            quantity: item.quantity,
            category: productData.category,
          };
        } else {
          throw new Error(`Product not found with ID: ${item.productId}`);
        }
      })
    );

    console.log(typeof paymentMethod + 'halo');
    if (paymentMethod === 'COD') {
      const order = new orderModel({
        userId,
        address: selectedAdd,
        payment: {
          method: paymentMethod,
          amount: finalAmount,
        },
        products,
      });

      // Save the order with COD payment method
      await order.save();

      // Clear the cart after successful COD order
      user.cart.items.splice(0, productIds.length);
      await user.save();

      console.log('created COD order');
      return res.status(200).json({ message: 'Order created successfully' });
    } else {
      // For Online Payment, create a Razorpay order and send the order ID back to the frontend
      const options = {
        amount: finalAmount * 100,
        currency: 'INR',
        receipt: 'order_receipt',
        payment_capture: 1,
      };

      const razorpayOrder = await razorpay.orders.create(options);
      return res.json({ orderId: razorpayOrder.id, finalAmount });
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: 'Server error' });
  }
};

const savePayment = async (req, res) => {
  try {
    const userId = req.session.user;
    const user = await User.findById(userId);

    const productIds = user.cart.items.map((product) => {
      return {
        productId: product.productId,
        quantity: product.quantity,
        price: product.price,
      };
    });
    const products = await Promise.all(
      productIds.map(async (item) => {
        const productData = await productModel.findById(item.productId);
        if (productData) {
          return {
            p_id: productData._id,
            p_name: productData.name,
            price: item.price,
            image: productData.image,
            quantity: item.quantity,
            category: productData.category,
          };
        } else {
          throw new Error(`Product not found with ID: ${item.productId}`);
        }
      })
    );
    const {paymentMethod,shippingAddress,finalAmount}=req.body
    const order = new orderModel({
      userId,
      address: shippingAddress,
      payment: {
        method: paymentMethod,
        amount: finalAmount,
      },
      products,
    });

    // Save the order with Online Payment method
    await order.save();
    user.cart.items.splice(0, productIds.length);
    await user.save();

    // Send a success response to the frontend
    return res.status(200).json({ message: 'Payment successful' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Server error' });
  }
};

const orderDetails = async (req, res) => {
  try {
    const orderId = req.query.orderId;
    const order = await orderModel.findById(orderId).populate('userId', 'name email number');

    if (!order) {
      return res.status(404).send("Order not found");
    }

    const userId = order.userId;
    const user = await User.findById(userId).populate('address');

    if (!user) {
      return res.status(404).send("User not found");
    }

    const address = user.address.find((address) => address._id.toString() === order.address.toString());

    if (!address) {
      return res.status(404).send("Address not found");
    }
    let totalAmount = 0;
    order.products.forEach((product) => {
      totalAmount += parseInt(product.price);
    });

      // Apply coupon discount if applicable
      const coupon = await Coupon.findOne({ couponName: order.couponName });
    
      let discountAmount = 0;
      let discountedTotalAmount = totalAmount;
  
      if (coupon) {
        if (totalAmount >= coupon.minValue && totalAmount <= coupon.maxValue) {
          discountAmount = parseInt(coupon.couponValue);
          discountedTotalAmount = totalAmount - discountAmount ;
        }
      }
   // Calculate shipping charge
   const shippingCharge = 100.00;

   // Calculate final amount including shipping charge
   const finalAmount = discountedTotalAmount + shippingCharge;

    res.render("userSide/OrderDetials", { order, address,totalAmount,discountAmount,finalAmount,shippingCharge });
  } catch (error) {
    console.log(error);
    res.status(500).send("Internal Server Error");
  }
};

const cancelOrder = async (req, res) => {
  try {
    const orderId = req.params.id;
    console.log(orderId);
    // Find the order by ID and update the status to "Cancelled"
    const updatedOrder = await orderModel.findByIdAndUpdate(orderId, { status: 'Cancelled' }, { new: true });

    if (!updatedOrder) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Redirect to the Myorders page after cancelling the order
    res.redirect("/Myorders");
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
};

const returnOrder =async(req,res)=>{
  try{
    const orderId = req.params.id;
    const updatedOrder = await orderModel.findByIdAndUpdate(orderId,{status:'Returns'},{new:true});

    if(!updatedOrder){
      return res.status(404).json({error:'Order not found'});
    }

     res.json(updatedOrder);
  }catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
}



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
  checkout,
  forgotpassword,
  verifyotp,
  sendOtp,
  resetPassword,
  Cart,
  cartAdding,
  cartRemove,
  cartOuantity,
  userProfile,
  editProfile,
  profileOtp,
  changePassword,
  Myprofile,
  addAddress,
  editAddress,
  myWishlist,
  addToWishlist,
  myOrder,
  order,
  orderDetails,
  cancelOrder,
  returnOrder,
  coupon,
  savePayment,
  paswordChange,
  searchProduct,
};
