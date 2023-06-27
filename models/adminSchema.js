const mongoose = require('mongoose');


const adminSchema = new mongoose.Schema({
    email: {
        type : String,
        require: true
    },
    password :{
        type: String,
        require: true
    },
    name :{
        type: String,
    }
})

const admin = mongoose.model('Admin', adminSchema);
module.exports = admin