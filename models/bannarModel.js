const mongoose = require('mongoose')

const bannerSchema = mongoose.Schema({
    BannerName: {
        type: String,
        required: true
    },
    image: {
        type: Array,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    description2: {
        type: String,
        required: true
    },
    is_active: {
        type: Number,
        default: 0
    }
})

module.exports = mongoose.model('banner', bannerSchema)