const mongoose =require('mongoose');

const couponSchema = new mongoose.Schema({
     userId:[{
        type:String
     }],
     couponName:{
        type:String,
        require:true,
        unique: true
     },
     couponValue:{
        type:String,
        require:true
     },
     expiryDate:{
        type:String,
        require:true
     },
     maxValue:{
        type:Number,
        require:true
     },
     minValue:{
        type:Number,
        require:true
     }
});

const couponModel  = mongoose.model('coupon',couponSchema);
module.exports = couponModel;