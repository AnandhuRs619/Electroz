const mongoose = require("mongoose");
const userModel = require('./userSchema');
const productModel = require("./productModel");


const orderSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: userModel
    },
    address: {},
    status: {
        type: String,
        default: "Processing"
    },
    orderCancleRequest: {
        type: Boolean,
        default: false
    },
    orderReturnRequest: {
        type: Boolean,
        default: false
    },
    products: [{
        p_id:{
            type: mongoose.Schema.Types.ObjectId,
            ref: productModel
        },
        p_name: {
            type: String,
            require: true
        },
        realPrice: {
            type: String,
            // require: true
        },
        price: {
            type: String,
            require: true
        },
        description: {
            type: String,
            // require: true
        },
        image: [{
            type: String,
            require: true
        }],
        category: [{
            type: String,
            require: true
        }],
        size: {
            type: String,
            // require: true
        },
        color: {
            type: String,
            // require: true
        },
        quantity: {
            type: String,
            require: true
        },
    }],
    payment: {
        method: {
            type: String,
        },
        amount: {
            type: String,
        }
    },
    proCartDetail: {
        type: Array
    },
    cartProduct: {
        type: Array
    },
    createdAt: {
        type: Date,
        immutable: true,
        default: () => Date.now()
    },
    expectedDelivery: {
        type: Date,
    }
});

const orderModel = mongoose.model('order', orderSchema);
module.exports = orderModel;