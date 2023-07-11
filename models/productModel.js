const mongoose = require('mongoose')

const productSchema = new mongoose.Schema({

    name: {
        type: String,
        required: true
    },
    Brand_name: {
        type: String,
        required: true
    },
    finalPrice:{
        type:String
    },
    stock: {
        type: Number,
        required: true
    },
    description: {
        type: String,
    },
    price: {
        type: String,
        required: true
    },
    category: {
        type: String,
      
    },
    discount: {
        type: Number,
        required: true
    },
    image: {
        type: [],
    },
    isAvailable: {
        type: Number,
        default: 1
    },
    
})
module.exports = mongoose.model('product', productSchema)
