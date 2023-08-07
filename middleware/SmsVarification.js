const fast2sms = require("fast-two-sms");
require("dotenv").config();
const  fasttwoAPI = process.env.AUTH


const sendMessage = function (mobile, res, next) {
    const Otp = Math.floor(Math.random() * 9000) + 1000;
  var options = {
    authorization :fasttwoAPI,
    message: `your OTP verification code is ${Otp}`,
    numbers: [mobile],
  };



  //send this message
  fast2sms
    .sendMessage(options)
    .then((response) => {
      console.log("otp sent successfully");
    })
    .catch((error) => {
      console.log(error);
    });
  return Otp;
};


module.exports = {
  sendMessage,
};