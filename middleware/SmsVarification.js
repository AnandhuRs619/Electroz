// const fast2sms = require("fast-two-sms");
// require("dotenv")



// const sendMessage = function (mobile, res, next) {
//   let randomOTP = 1532; 
//   var options = {
//     authorization : process.env.AUTH,
//     message: `your OTP verification code is ${randomOTP}`,
//     numbers: [mobile],
//   };



//   //send this message
//   fast2sms
//     .sendMessage(options)
//     .then((response) => {
//       console.log("otp sent successfully");
//     })
//     .catch((error) => {
//       console.log(error);
//     });
//   return randomOTP;
// };


// module.exports = {
//   sendMessage,
// };