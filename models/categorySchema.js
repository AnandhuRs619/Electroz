const mongoose = require("mongoose");

const categorySchema = new mongoose.Schema({
    categoryName: {
        type: String,
        unique: true,
        require: true
    },
    discount: {
        type: Number,
        default: 0
    },
    description: {
        type: String,
    },
    isAvailable: {
        type: Boolean,
        default: true
    }
});
const category = mongoose.model('category', categorySchema);

module.exports = category;

