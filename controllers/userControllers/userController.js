const User = require("../../models/userSchema");
const bcrypt = require("bcrypt");
const products = require("../../models/productModel");
require("dotenv");
const fast2sms = require("../../confg/fast2sms-config");
const productModel = require("../../models/productModel");
const orderModel = require("../../models/OderSchema");

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
    const product = await products.find({ isAvailable: true });
    res.render("userSide/productList", { product });
  } catch (error) {}
};

const productDetails = async (req, res) => {
  try {
    const id = req.params.id;
    const productDetails = await products.find({ _id: id });
    const productDetail = await products.findOne({ _id: id });
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
const Cart = async (req, res) => {
  try {
    const userId = req.session.user;
    const userDetails = await User.findById(userId).populate(
      "cart.items.productId"
    );

    if (!userDetails || !userDetails.cart) {
      // Handle the scenario when cart data is missing or user details are not found
      return res.status(404).send("Cart data not found");
    }

    const cartItems = userDetails.cart.items;
    res.render("userSide/Cart", { cartItems });
  } catch (error) {
    console.error(error);
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
    const productPrice = parseInt(product.price);
    if (existingCartItem) {
      existingCartItem.quantity += 1;
      existingCartItem.price = existingCartItem.quantity * productPrice;
    } else {
      const newCartItem = {
        productId: Id,
        quantity: 1,
        price: productPrice,
        realPrice: product.price,
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
    const id = req.params.id;
    const userId = req.session.user;
    console.log(id);
    await User.updateOne(
      { _id: userId },
      { $pull: { "cart.items": { _id: id } } }
    );
    res.json({ success: true });
    res.redirect("/cart");
  } catch (error) {
    console.log(error);
    res.status(500).send("Internal error at cartRemove");
  }
};

const cartOuantity = async (req, res) => {
  try {
  } catch (error) {
    console.log(error);
    res.status(500).send("Internal error at cartRemove");
  }
};
const checkout = async (req, res) => {
  try {
    const userId = req.session.user;
    const userDetails = await User.findById(userId).populate(
      "cart.items.productId"
    );

    if (!userDetails || !userDetails.cart) {
      // Handle the scenario when cart data is missing or user details are not found
      return res.status(404).send("Cart data not found");
    }
    const address = userDetails.address;
    const cartItems = userDetails.cart.items;
    res.render("userSide/Checkout", { cartItems, address });
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal  Server Error");
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

const changePassword = async (req, res) => {
  try {
    const { otp, newPassword } = req.body;

    // Verify the OTP
    const storedOTP = req.session.otp;
    if (otp !== storedOTP) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    // Update the user's password
    const userId = req.session.user;
    const user = await User.findById(userId);
    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }

    user.password = newPassword;
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
    const productExists = user.wishlist.some((item) => item.productId.toString() === id.toString());
    if (productExists) {
      return res.status(400).json({ message: 'Product already exists in the wishlist' });
    }
    const wishlistItem = {
      productId: id.toString(),
      name: name
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
    const userOrder = await orderModel.find({ userId: userId });
    res.render("userSide/Myorder", { userOrder });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Server error" });
  }
};

const order = async (req, res) => {
  try {
    const userId = req.session.user;
    const { shippingAddress, paymentMethod } = req.body;
    console.log(req.body);
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
const selecetdadd=selectedAddress._id
    const totalAmount = productIds.reduce((total, item) => total + Number(item.price), 0);

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

    const order = new orderModel({
      userId,
      address:selecetdadd , // Save the selected address reference as an array
      payment: {
        method: paymentMethod,
        amount: totalAmount,
      },
      products,
    });

    // save
    await order.save();

    // clear
    user.cart.items.splice(0, productIds.length);
    await user.save();
    console.log("created order")
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: 'Server error' });
  }
};


const orderDetails = async (req, res) => {
  try {
    
    const orderId = req.params._id;
    console.log(orderId);
    const order = await orderModel.findById(orderId);
    res.render("userSide/OrderDetials",{order});
  } catch (error) {
    console.log(error);
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
};
