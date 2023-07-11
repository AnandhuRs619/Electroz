const express = require('express');
const router = express.Router();
const fast2sms = require("../../confg/fast2sms-config");

// Import models
const UserModel = require('../models/userModel');

// Render the forgot password form
router.get('/', (req, res) => {
  res.render('forgotPassword/index');
});

// Send OTP route
router.post('/send-otp', (req, res) => {
  const phoneNumber = req.body.phone;
  // Generate a random OTP
  const otp = generateOTP();

  // Call FastTwoSMS API to send the OTP to the user's mobile number
  const message = `Your OTP is ${otp}.`;

  FastTwoSMS.sendMessage(
    message,
    phoneNumber,
    process.env.FAST_TWO_SMS_API_KEY // Replace with your FastTwoSMS API key
  )
    .then((response) => {
      // Store the OTP and phone number in session or database for verification
      req.session.phone = phoneNumber;
      req.session.otp = otp;
      res.redirect('/forgot-password/verify-otp');
    })
    .catch((error) => {
      console.error(error);
      res.status(500).send('Failed to send OTP. Please try again later.');
    });
});

// Render the OTP verification form
router.get('/verify-otp', (req, res) => {
  res.render('forgotPassword/verifyOTP');
});

// Verify OTP route
router.post('/verify-otp', (req, res) => {
  const otp = req.body.otp;
  const { phone, otp: storedOtp } = req.session;

  // Check if the entered OTP matches the stored OTP
  if (otp === storedOtp) {
    res.redirect('/forgot-password/reset-password');
  } else {
    res.status(400).send('Invalid OTP. Please try again.');
  }
});

// Render the password reset form
router.get('/reset-password', (req, res) => {
  res.render('forgotPassword/resetPassword');
});

// Reset password route
router.post('/reset-password', (req, res) => {
  const password = req.body.password;
  const password2 = req.body.password2;
  const phone = req.session.phone;

  // Check if the password and confirm password match
  if (password === password2) {
    // Update the password for the user with the given phone number
    UserModel.updatePassword(phone, password);

    // Clear the session
    req.session.destroy();
    res.redirect('/forgot-password/reset-password-successful');
  } else {
    res.status(400).send('Passwords do not match. Please try again.');
  }
});

// Render the password reset successful page
router.get('/reset-password-successful', (req, res) => {
  res.render('forgotPassword/resetPasswordSuccessful');
});

// Generate a 6-digit OTP
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000);
}

module.exports = router;
