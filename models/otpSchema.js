const mongoose = require("mongoose");

const otpSchema = mongoose.Schema;

const otpVerificationSchema = new Schema({

    userId: String,
    otp: String,
    createdAt: Date,
    expiresAt: Date,
});

const otpVerification = mongoose.model(
    "otpVerification",
    otpVerificationSchema
);


module.exports = otpVerification;


