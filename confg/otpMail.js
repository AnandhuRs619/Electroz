const otpGenerator = require('./otpGenerator');

const sendOTP = (otp, user) => {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: 'ananthurs619@gmail.com',
        pass: 'uupjissennnvnkjq'
      },
    });
    const mailOptions = {
      from: 'ananthurs619@gmail.com',
      to: user.email,
      subject: "Verify your email address",
      text: `Your OTP is ${otp}`,
    };
  
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.log(error);
      } else {
        console.log("Email sent: " + info.response);
      }
    });
  };
   
module.exports = sendOTP;