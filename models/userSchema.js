const mongoose = require('mongoose');
const productModel =require('./productModel')

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
        required: true
    },
    password: {
        type: String,
        required: true
    },
    isBlocked: {
        type: Boolean,
        default: false,
       
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
                type: Number,
            },
            price: {
                type: Number,
                require: true
            }
        }]
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

const User = mongoose.model("user", userSchema);
module.exports = User
