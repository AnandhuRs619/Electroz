// user.js (user schema)
const mongoose = require('mongoose');
const productModel = require('./productModel');
const Coupon = require('./couponSchema');
const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    unique: true,
    required: true
  },
  number: {
    type: String,
    unique: true,
    required: true
  },
  password: {
    type: String,
    required: true
  },
  isBlocked: {
    type: Boolean,
    default: false
  },
  cart: {
    items: [{
      productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: productModel
      },
      quantity: {
        type: Number,
        default: 1
      },
      realPrice: {
        type: Number
      },
      price: {
        type: Number,
        required: true
      },
    }]
  },
  discountAmount: {
    type: Number
  },
  subtotal: {
    type: Number,
    default: 0
  },
  appliedCoupon: {
    type: mongoose.Schema.Types.ObjectId,
    ref: Coupon,
    default: null,
  },
  walletamount: {
      type: Number
  },
  wishlist: [{
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: productModel
    }
  }],
 
  address: [{
    name: {
      type: String,
      required: true
    },
    addressline: {
      type: String,
      required: true
    },
    street: {
      type: String,
      required: true
    },
    city: {
      type: String,
      required: true
    },
    state: {
      type: String,
      required: true
    },
    phone: {
      type: Number,
      required: true
    },
    postCode: {
      type: Number,
      required: true
    },
    country: {
      type: String,
      required: true
    }
  }]
}, { timestamps: true });

// Calculate and update the subtotal whenever the cart items or quantities change
userSchema.pre('save', function(next) {
  const subtotal = this.cart.items.reduce((total, item) => {
    const price =  item.price; // Use realPrice if available, otherwise use price
    return total + price;
  }, 0);
  this.subtotal = subtotal;
  next();
});

const User = mongoose.model('User', userSchema);
module.exports = User;
