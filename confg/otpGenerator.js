
function generateOTP() {
    // Define the length of the OTP
    const otpLength = 4;
  
    // Define possible characters in the OTP
    const characters = '0123456789';
  
    let otp = '';
  
    for (let i = 0; i < otpLength; i++) {
      // Generate a random index to select a character from the characters string
      const randomIndex = Math.floor(Math.random() * characters.length);
  
      // Append the selected character to the OTP
      otp += characters[randomIndex];
    }
  
    return otp;
  }
  
  // Generate and display the OTP
  const otp = generateOTP();
  console.log('Generated OTP:', otp);
  
  module.exports = otp;