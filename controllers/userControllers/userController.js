const User = require("../../models/userSchema");
const bcrypt = require("bcrypt");
const products = require("../../models/productModel");
require("dotenv");
const fast2sms = require("../../confg/fast2sms-config");
const productModel = require("../../models/productModel");
const orderModel = require("../../models/OderSchema");
const Coupon = require("../../models/couponSchema");
const Category = require("../../models/categorySchema");
const Razorpay = require("razorpay");
const Bannar = require("../../models/bannarModel");
const easyinvoice = require("easyinvoice");
//  Razorpoy
const key_id = process.env.RAZORPAY_API_Id;
const key_secret = process.env.RAZORPAY_API_Key;
const razorpay = new Razorpay({
  key_id: "rzp_test_tfaNKW9QlZ9Yp9", // Replace with your actual Razorpay test key
  key_secret: "OVrPNai520EfZTw0ROQySCN7", // Replace with your actual Razorpay test secret
});

// HOME RENDERING
const home = async (req, res) => {
  try {
    const banner = await Bannar.findOne({ is_active: 1 });
    res.render("userSide/Home", { banner });
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
    res.status(500).send("Internal Server Error");
  }
};

const sendOtp = async (req, res) => {
  try {
    const phoneNumber = req.body.phone;
    console.log(phoneNumber);
    console.log(req.body);
    // OTP generation
    const otp = Math.floor(1000 + Math.random() * 9000);
    console.log(otp);
    fast2sms
      .sendMessage({
        authorization:
          "MmiGSpB20ev9fNcuVWXQ1TKjsE3AF5oxP8CwLygtZOYdHkaznIacfJgFCWdENAOwYPho7RIjkipQrutl", // Replace with your actual API key
        message: `Your verification OTP is: ${otp}`,
        phoneNumber,
      })
      .then((response) => {
        // Store the OTP and phone number in session for verification
        req.session.phone = phoneNumber;
        req.session.otp = otp;
        req.session.save(() => {
          res.redirect("/verify-otp");
        });
      })
      .catch((error) => {
        console.error(error);
        res.status(500).send("Failed to send OTP. Please try again later.");
      });
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
};

const verifyotp = async (req, res) => {
  try {
    const otp = req.body.otp;
    const { phone, otp: storedOtp } = req.session;

    if (otp === storedOtp) {
      res.redirect("/reset-password");
    } else {
      res.status(400).send("Invalid OTP. Please try again.");
    }
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
};

const resetPassword = async (req, res) => {
  try {
    const password = req.body.password;
    const password2 = req.body.password2;
    const phone = req.session.phone;

    if (password === password2) {
      // Find the user by phone number
      const user = await User.findOne({ phone });

      if (!user) {
        return res.status(404).send("User not found.");
      }

      // Update the user's password
      user.password = password;
      await user.save();

      // Clear the session after password update
      req.session.destroy(() => {
        res.redirect("/forgot-password/reset-password-successful");
      });
    } else {
      res.status(400).send("Passwords do not match. Please try again.");
    }
  } catch (error) {
    console.error(error);
    res.status(500).send("Failed to update password. Please try again later.");
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
    const sortType = req.query.sort; // "0" for high to low, "1" for low to high

    // Get the filters from the request query
    const selectedCategory = req.query.category;
    const selectedBrand = req.query.brand;
    const minPrice = parseFloat(req.query.minPrice);
    const maxPrice = parseFloat(req.query.maxPrice);

    // Build the filter object based on the selected options
    const filter = { isAvailable: true };
    if (selectedCategory) {
      filter.categoryName = selectedCategory;
    }
    if (selectedBrand) {
      filter.Brand_name = selectedBrand;
    }
    if (!isNaN(minPrice) && !isNaN(maxPrice)) {
      filter.discountedPrice = { $gte: minPrice, $lte: maxPrice };
    } else if (!isNaN(minPrice)) {
      filter.discountedPrice = { $gte: minPrice };
    } else if (!isNaN(maxPrice)) {
      filter.discountedPrice = { $lte: maxPrice };
    }

    // Fetch products based on the filter and sort options
    const [totalProduct, product, categories] = await Promise.all([
      productModel.find(filter),
      productModel
        .find(filter)
        .skip((page - 1) * productPerPage)
        .limit(productPerPage)
        .sort({ price: sortType }),
      Category.find({ isAvailable: true }),
    ]);

    const totalPages = Math.ceil(totalProduct.length / productPerPage);

    const categoryCountMap = await productModel
      .aggregate([
        { $match: { isAvailable: true } },
        { $group: { _id: "$categoryName", count: { $sum: 1 } } },
      ])
      .then((data) =>
        Object.fromEntries(
          data.map((categoryData) => [categoryData._id, categoryData.count])
        )
      );

    const brandCountMap = await productModel
      .aggregate([{ $group: { _id: "$Brand_name", count: { $sum: 1 } } }])
      .then((data) =>
        Object.fromEntries(
          data.map((brandData) => [brandData._id, brandData.count])
        )
      );

    const productsWithCategory = product.map((prod) => {
      const category = categories.find(
        (cat) => cat._id.toString() === prod.category.toString()
      );
      return {
        ...prod.toObject(),
        categoryName: category ? category.categoryName : "",
      };
    });

    const brands = await productModel.distinct("Brand_name");

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
      selectedCategory,
      selectedBrand,
      minPrice,
      maxPrice,
      sortType,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
};

const filterProducts = async (req, res) => {
  try {
    const productPerPage = 9;
    const page = parseInt(req.query.page) || 1;
    const sortType = req.query.sort;
    const selectedCategories = req.query.category
      ? req.query.category.split(",")
      : [];
    const selectedBrands = req.query.brand ? req.query.brand.split(",") : []; // Array of selected brand names
    const minPrice = parseFloat(req.query.minPrice); // Get the minimum price from the query parameter
    const maxPrice = parseFloat(req.query.maxPrice); //// Get the maximum price from the query parameter

    // Build the filter query based on the selected options
    const filterQuery = {};
    if (selectedCategories && selectedCategories.length > 0) {
      filterQuery.category = { $in: selectedCategories };
    }
    if (selectedBrands && selectedBrands.length > 0) {
      filterQuery.Brand_name = { $in: selectedBrands };
    }
    if (!isNaN(minPrice) && !isNaN(maxPrice)) {
      filterQuery.discountedPrice = { $gte: minPrice, $lte: maxPrice };
    } else if (!isNaN(minPrice)) {
      filterQuery.discountedPrice = { $gte: minPrice };
    } else if (!isNaN(maxPrice)) {
      filterQuery.discountedPrice = { $lte: maxPrice };
    }
    const totalProducts = await productModel.countDocuments(filterQuery);
    const totalPages = Math.ceil(totalProducts / productPerPage);
    const skipProducts = (page - 1) * productPerPage;
    const filteredProducts = await productModel
      .find(filterQuery)
      .skip(skipProducts)
      .limit(productPerPage);

    // Fetch the categories to map categoryName to products
    const categories = await Category.find({ isAvailable: true });

    // Map over the filtered products and add categoryName to each product
    const productsWithCategory = filteredProducts.map((prod) => {
      const category = categories.find(
        (cat) => cat._id.toString() === prod.category.toString()
      );
      return {
        ...prod.toObject(),
        categoryName: category ? category.categoryName : "",
      };
    });

    // Sort the products based on the sortType
    if (sortType === "1") {
      productsWithCategory.sort(
        (a, b) => a.discountedPrice - b.discountedPrice
      );
    } else {
      productsWithCategory.sort(
        (a, b) => b.discountedPrice - a.discountedPrice
      );
    }

    // Send the filtered products as JSON response
    res.json(productsWithCategory);
  } catch (error) {
    console.error("Error filtering products:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const productDetails = async (req, res) => {
  try {
    const id = req.params.id;
    const productDetails = await products.find({ _id: id });
    const productDetail = await products.findOne({ _id: id });
    // Merge category name into each product based on category ID
    const categories = await Category.find();
    const category = categories.find(
      (cat) => cat._id.toString() === productDetail.category.toString()
    );
    productDetail.categoryName = category ? category.categoryName : "";

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
    const user = await User.findById(userId);
    const couponId = user.appliedCoupon;
    console.log(couponId);
    const coupons = await Coupon.find();
    const coupon = await Coupon.findById(couponId);
    let couponName = ""; // Declare the couponName variable here

    if (!coupon) {
      console.log("Coupon not found");
      // Handle the case when the coupon is not found, e.g., set couponName to an empty string
    } else {
      couponName = coupon.couponName; // Assign value to couponName if coupon is found
      console.log(couponName);
    }
    if (!userDetails || !userDetails.cart) {
      // Handle the scenario when cart data is missing or user details are not found
      return res.status(404).send("Cart data not found");
    }

    const selectedCouponValue = parseInt(req.body.selectedCouponValue); // Get the selected coupon's discount value from the frontend

    let subtotal = user.subtotal;
    let totalCategoryDiscountAmount = 0; // Initialize the total category discount amount

    for (const product of userDetails.cart.items) {
      // Calculate the total price of each product based on its quantity
      const productPrice =
        parseInt(product.productId.discountedPrice) * product.quantity;
      // totalAmount += productPrice;

      // Fetch the category discount for the current product
      const category = await Category.findOne({
        categoryName: product.productId.category,
      });

      // Calculate the category discount amount for the current product based on percentage
      const categoryDiscountPercentage = category ? category.discount : 0;
      const categoryDiscountAmount =
        (productPrice * categoryDiscountPercentage) / 100;

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
    const shippingCharge = 100.0;

    // Calculate final amount including shipping charge
    const finalAmount =
      discountedTotalAmount + shippingCharge - totalCategoryDiscountAmount;

    const cartItems = userDetails.cart.items;
    res.render("userSide/Cart", {
      user,
      cartItems,
      coupons,
      couponName,
      discountAmount,
      shippingCharge,
      finalAmount,
      totalCategoryDiscountAmount,
    });
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
    const searchedProducts = await productModel
      .find({ name: searchPattern })
      .exec();
    console.log(searchedProducts);
    const searchedProductIds = searchedProducts.map((product) => product._id);

    const otherProducts = await productModel
      .find({
        _id: { $nin: searchedProductIds },
      })
      .exec();

    const products = searchedProducts;
    res.json(products);
  } catch (error) {
    console.log(error.message);
    res.status(500).send("Internal Server Error");
  }
};

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
      return res.status(404).json({ error: "User not found" });
    }

    // Find the index of the item in the cart items array with the matching productId
    const itemIndex = user.cart.items.findIndex(
      (item) => item.productId.toString() === productId
    );

    if (itemIndex === -1) {
      return res.status(404).json({ error: "Product not found in cart" });
    }

    user.cart.items.splice(itemIndex, 1);

    await user.save();

    res.json({
      success: true,
      message: "Product removed from cart successfully",
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Internal server error" });
  }
};

const cartOuantity = async (req, res) => {
  try {
    const { quantity, productId } = req.body;
    const userId = req.session.user;
    const userDetails = await User.findById({ _id: userId });
    const cart = userDetails.cart.items;
    const existingCartItem = cart.find((item) => item.productId == productId);

    // Retrieve the product details from the database (assuming there's a Product model)
    const productDetails = await productModel.findById({ _id: productId });

    // Update the quantity and calculate the updated price
    existingCartItem.quantity = quantity;
    existingCartItem.price =
      existingCartItem.quantity * productDetails.discountedPrice; // Assuming productDetails contains the product's price

    userDetails.save();
    console.log(existingCartItem);
    res.json("halooo");
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
};

const checkout = async (req, res) => {
  try {
    const userId = req.session.user;
    const userDetails = await User.findById(userId).populate(
      "cart.items.productId"
    );
    const user = await User.findById(userId);
    if (!userDetails || !userDetails.cart) {
      // Handle the scenario when cart data is missing or user details are not found
      return res.status(404).send("Cart data not found");
    }
    const walletAmount = user.walletamount;
    // Calculate total amount and total category discount amount
    let totalAmount = 0;
    let totalCategoryDiscountAmount = 0;

    for (const product of userDetails.cart.items) {
      const productPrice =
        parseInt(product.productId.discountedPrice) * product.quantity;
      totalAmount += productPrice;

      const category = await Category.findOne({
        categoryName: product.productId.category,
      });
      const categoryDiscountPercentage = category ? category.discount : 0;
      const categoryDiscountAmount =
        (productPrice * categoryDiscountPercentage) / 100;
      totalCategoryDiscountAmount += categoryDiscountAmount;
    }

    // Apply coupon discount if applicable
    const selectedCouponValue = parseInt(req.body.selectedCouponValue);
    let discountAmount = 0;

    if (selectedCouponValue > 0) {
      discountAmount = selectedCouponValue;
    }

    // Calculate shipping charge
    const shippingCharge = 100.0;

    // Calculate final amount including shipping charge and all discounts
    const discountedTotalAmount =
      totalAmount - discountAmount - totalCategoryDiscountAmount;
    const finalAmount = discountedTotalAmount + shippingCharge;

    const address = userDetails.address;
    const cartItems = userDetails.cart.items;
    res.render("userSide/Checkout", {
      user,
      cartItems,
      address,
      walletAmount,
      totalAmount,
      discountAmount,
      finalAmount,
      shippingCharge,
      totalCategoryDiscountAmount,
    });
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

    // Check if the user has already applied a coupon

    const couponValue = await Coupon.findOne({
      couponName: selectedCouponValue,
    });
    if (!couponValue) {
      return res.status(404).json({ message: "Coupon not Found" });
    }
    const existingCoupon = await User.findOne({
      _id: userId,
      appliedCoupon: couponValue._id,
    });
    if (existingCoupon) {
      return res.status(400).json({ message: "Coupon already applied" });
    }
    const date = new Date();
    const newDate = date.toLocaleDateString();

    // Assuming couponValue.expiryDate is in the format "2023-07-14"
    const expiryDate = new Date(couponValue.expiryDate);
    const formattedExpiryDate = expiryDate.toLocaleDateString();

    console.log(formattedExpiryDate);
    console.log(newDate);

    if (formattedExpiryDate < newDate) {
      return res.status(400).json({ message: "Coupon has expired" });
    }

    if (totalAmount < couponValue.minValue) {
      return res.status(400).json({
        message: "Total amount is not within the valid range for this coupon",
      });
    }

    const couponPercentage = couponValue.couponValue; // Assuming couponValue contains the percentage value (e.g., 10 for 10% discount)
    console.log(couponPercentage);
    const maxPercentage = couponValue.maxValue; // Assuming couponValue contains the maximum percentage value allowed (e.g., 50 for 50% max discount)

    console.log(maxPercentage);

    if (couponPercentage > maxPercentage) {
      return res.status(400).json({
        message:
          "Discount percentage exceeds the maximum allowed for this coupon",
      });
    }
    // Calculate the discount amount as a percentage of the subtotal
    const discountAmount = (couponPercentage / 100) * user.subtotal;
    console.log(discountAmount);

    // Calculate the final amount after applying the discount
    const finalAmount = Math.floor(user.subtotal - discountAmount);
    console.log(finalAmount);

    // Update the user's appliedCoupon field with the ID of the applied coupon
    user.appliedCoupon = couponValue._id;
    await user.save();

    res.json({ finalAmount, discountAmount });
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
};

const removeCoupon = async (req, res) => {
  try {
    const userId = req.session.user;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (!user.appliedCoupon) {
      return res.status(400).json({ message: "No coupon applied" });
    }

    // Remove the appliedCoupon field from the user
    user.appliedCoupon = null;
    await user.save();

    // Update the response to remove the discount amount
    res.json({ finalAmount: user.subtotal, discountAmount: 0 });
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

const Myprofile = async (req, res) => {
  try {
    const userId = req.session.user;
    userDetails = await User.findById({ _id: userId });

    res.render("userSide/Myprofile", { userDetails });
  } catch (error) {
    console.log(error);
  }
};

const editProfile = async (req, res) => {
  try {
    const userId = req.session.user;
    const { name, email } = req.body;

    // Find the user by their ID and update the fields
    const user = await User.findByIdAndUpdate(userId, {
      $set: { name: name, email: email },
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

const paswordChange = async (req, res) => {
  try {
    const userId = req.body.user;
    const user = await User.findById(userId);
    const number = user.number;
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
const changePassword = async (req, res) => {
  try {
    const { otp, newPassword } = req.body;
    const password = await securePassword(newPassword);
    console.log(password);
    console.log(typeof password);
    // Verify the OTP
    const storedOTP = req.session.otp;
    console.log("njan varuthan" + otp);
    console.log("njan evida ull ala" + storedOTP);
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
    res.render("userSide/MyWishlist", { productDetails });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const addToWishlist = async (req, res) => {
  try {
    const userId = req.session.user;
    const { name, id } = req.body;
    console.log(req.body);
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    // Check if the product already exists in the wishlist
    const productExists = user.wishlist.some(
      (item) => item.productId.toString() === id
    );
    if (productExists) {
      return res
        .status(400)
        .json({ message: "Product already exists in the wishlist" });
    }
    const wishlistItem = {
      productId: id,
    };
    user.wishlist.push(wishlistItem);
    await user.save();

    // Return a success response
    res.status(200).json({ message: "Product added to wishlist successfully" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal server error" });
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
      const address = addresses.find(
        (addr) => addr._id.toString() === order.address.toString()
      );
      return {
        ...order.toObject(),
        name: address ? address.name : "",
      };
    });

    // Sort orders by date in descending order (recent first)
    orderWithAddress.sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    );

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
    const { shippingAddress, paymentMethod, finalAmount } = req.body;
    console.log(paymentMethod);
    const user = await User.findById(userId);
    const walletAmount = user.walletamount;
    const productIds = user.cart.items.map((product) => {
      return {
        productId: product.productId,
        quantity: product.quantity,
        price: product.price,
      };
    });

    const selectedAddress = user.address.find(
      (address) => address._id.toString() === shippingAddress
    );
    if (!selectedAddress) {
      return res.status(400).json({ message: "Invalid shipping address" });
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

    console.log(typeof paymentMethod + "halo");
    if (paymentMethod === "COD") {
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

      console.log("created COD order");
      return res.status(200).json({ message: "Order created successfully" });
    } else if (paymentMethod === "Wallet") {
      if (walletAmount >= finalAmount) {
        user.walletamount -= finalAmount;
        await user.save();
        const order = new orderModel({
          userId,
          address: selectedAdd,
          payment: {
            method: paymentMethod,
            amount: finalAmount,
          },
          products,
        });

        // Save the order with wallet payment method
        await order.save();

        // Clear the cart after successful wallet order
        user.cart.items.splice(0, productIds.length);
        await user.save();
        console.log("created wallet order");
        return res.status(200).json({ message: "Order created successfully" });
      } else {
        // If wallet amount is less than the final amount, pay the remaining amount online

        // Deduct the wallet amount from the final amount
        const remainingAmount = finalAmount - walletAmount;
        user.walletamount = 0;
        await user.save();
        const options = {
          amount: remainingAmount * 100,
          currency: "INR",
          receipt: "order_receipt",
          payment_capture: 1,
        };

        const razorpayOrder = await razorpay.orders.create(options);

        return res.json({ orderId: razorpayOrder.id, remainingAmount });
      }
    } else {
      // For Online Payment, create a Razorpay order and send the order ID back to the frontend
      const options = {
        amount: finalAmount * 100,
        currency: "INR",
        receipt: "order_receipt",
        payment_capture: 1,
      };

      const razorpayOrder = await razorpay.orders.create(options);
      return res.json({ orderId: razorpayOrder.id, finalAmount });
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "Server error" });
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
    const { paymentMethod, shippingAddress, finalAmount } = req.body;
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
    return res.status(200).json({ message: "Payment successful" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Server error" });
  }
};

const orderDetails = async (req, res) => {
  try {
    const orderId = req.query.orderId;
    const order = await orderModel
      .findById(orderId)
      .populate("userId", "name email number");

    if (!order) {
      return res.status(404).send("Order not found");
    }

    const userId = order.userId;
    const user = await User.findById(userId).populate("address");

    if (!user) {
      return res.status(404).send("User not found");
    }

    const address = user.address.find(
      (address) => address._id.toString() === order.address.toString()
    );

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
        discountedTotalAmount = totalAmount - discountAmount;
      }
    }
    // Calculate shipping charge
    const shippingCharge = 100.0;

    // Calculate final amount including shipping charge
    const finalAmount = discountedTotalAmount + shippingCharge;

    res.render("userSide/OrderDetials", {
      order,
      address,
      totalAmount,
      discountAmount,
      finalAmount,
      shippingCharge,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send("Internal Server Error");
  }
};

const cancelOrder = async (req, res) => {
  try {
    const orderId = req.params.id;

    // Find the order by ID
    const order = await orderModel.findById(orderId);

    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    // Check if the order has already been delivered
    if (order.status === "Delivered") {
      return res.status(400).json({ error: "Cannot cancel a delivered order" });
    }

    // Check if the cancel request has already been sent
    if (order.status === "Cancelled") {
      return res
        .status(400)
        .json({ error: "Cancel request already sent for this order" });
    }
    if (order.status === "Cancel Request") {
      return res
        .status(400)
        .json({ error: "Cancel request already sent for this order" });
    }
    if (order.payment.method === "onlinePayment") {
      // Calculate the total amount of the order products and add it to the wallet
      const totalAmount = order.payment.amount;
      // Assuming there's a wallet field in the user model, you can add the totalAmount to the wallet
      // Replace 'userId' with the actual user ID or wherever you store the user data
      const userId = order.userId;
      const user = await User.findByIdAndUpdate(userId, {
        $inc: { walletamount: totalAmount },
      });
      console.log(user);
    }
    // Update the order status to "Cancel Request" and set the "orderCancelRequest" flag to true
    const updatedOrder = await orderModel.findByIdAndUpdate(
      orderId,
      { $set: { orderCancelRequest: true, status: "Cancel Request" } },
      { new: true }
    );

    res.redirect("/Myorders");
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
};

const returnOrder = async (req, res) => {
  try {
    const orderId = req.params.id;

    const order = await orderModel.findById(orderId);

    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    if (
      order.status === "Returns" ||
      order.status === "Returns Request" ||
      order.status === "Cancelled"
    ) {
      return res
        .status(400)
        .json({ error: " request already sent for this order" });
    }
    if (order.status !== "Delivered") {
      return res
        .status(400)
        .json({ error: "Cannot request return for non-delivered orders" });
    }

    const currentDate = new Date();
    const orderedDate = order.orderDate; // Assuming you have an 'orderDate' field in your 'orderModel'

    // Calculate the difference in days between current date and ordered date
    const timeDifference = currentDate - orderedDate;
    const daysDifference = timeDifference / (1000 * 60 * 60 * 24);

    // Check if the return request is within 7 days of the ordered date
    if (daysDifference > 14) {
      return res.status(400).json({
        error:
          "Return request date has expired. You can only request return within 14 days of the order date.",
      });
    }

    const totalAmount = order.payment.amount;

    const userId = order.userId;
    const user = await User.findByIdAndUpdate(userId, {
      $inc: { walletamount: totalAmount },
    });
    console.log(user);
    const updatedOrder = await orderModel.findByIdAndUpdate(
      orderId,
      { $set: { orderReturnRequest: true, status: "Returns Request" } },
      { new: true }
    );

    res.json(updatedOrder);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
};
const WalletHistory = async (req, res) => {
  try {
    const Walletdetials = await orderModel.find({ "payment.method": "Wallet" });

    res.render("userSide/WalletHistory", { Walletdetials });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
};
const generateInvoice = async (req,res) => {
  const data = req.body;
  console.log("orderId"+ data.Orderdetials);
  const order = await orderModel.findById({_id:data.Orderdetials});
  const orderDetails = order.products
  console.log(orderDetails)
  
  try {
    const invoiceOptions = {
      documentTitle: "Invoice",
      currency: "INR",
      taxNotation: "GST",
      marginTop: 25,
      marginRight: 25,
      marginLeft: 25,
      marginBottom: 25,
      images: {
        logo: "", // Add your logo image path here if needed
      },
      sender: {
        company: "Electro",
        address: "skyline",
        zip: "695121",
        city: "Trivandrum",
        country: "Kerala",
        phone: "987-654-3210",
      },
      client: {
        company: data.name,
        address: data.address,
        zip: data.postcode,
        city: data.city,
        country: data.country,
        phone: data.phone,
      },
      information: {
        number: "nwewonw", // Access _id directly from the order object
        date: data.date,
        "due-date": 'nana',
      },
      products: [],
      subtotal: data.Totalamount,
      total: data.Totalamount, // Assuming you have a discount of $10
    };

    orderDetails.forEach((data) => {
      invoiceOptions.products.push({
          quantity: data.quantity,
          description: data.p_name,
          'tax-rate': 0,
          price: data.price,
      });
  });

    const result = await easyinvoice.createInvoice(invoiceOptions);
    const pdfBuffer = Buffer.from(result.pdf, "base64");
    res.setHeader("Content-Disposition", "attachment; filename=invoice.pdf");
    res.setHeader("Content-Type", "application/pdf");
    res.send(pdfBuffer);
  } catch (error) {
    console.log("Error generating invoice:", error);
    throw error;
  }
};
const downloadInvoice = async (req, res) => {
  try {
    const userId = req.session.user;
    const orderId = req.query.id;
    console.log(orderId);
    // Fetch user details from the userModel
    const userDetails = await User.findOne({ userId });

    // Fetch the complete order details from the orderModel
    const order = await orderModel.findById(orderId);

    // Create an array to store product IDs from the order
    const productIds = order.products.map((product) => product.p_id);

    // Fetch the complete product details for the order from the productModel using the product IDs
    const orderProducts = await productModel.find({ _id: { $in: productIds } });

    // Now you can proceed with the rest of your logic as before
    const address = userDetails.address.find(
      (item) => item._id.toString() === order.address.toString()
    );
    const subTotal = order.payment.amount;
    const orderCancelled = order.orderCancleRequest;
    const orderStatus = order.status;

    // Generate the invoice using the updated order object
    const invoiceBuffer = await generateInvoice(
      order,
      orderProducts,
      subTotal,
      address,
      orderCancelled,
      orderStatus
    );

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", "attachment; filename=invoice.pdf");
    res.send(invoiceBuffer);
  } catch (error) {
    console.log(error);
    res.status(500).send("Internal Server Error");
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
  removeCoupon,
  savePayment,
  paswordChange,
  searchProduct,
  filterProducts,
  WalletHistory,
  generateInvoice,
  downloadInvoice,
};
