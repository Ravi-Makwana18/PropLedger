// SMS Service for OTP (You can use Twilio, MSG91, or any other service)
const sendOTP = async (mobileNumber, otp) => {
  try {
    // For development, just log the OTP
    if (process.env.NODE_ENV === 'development') {
      console.log(`OTP for ${mobileNumber}: ${otp}`);
      return true;
    }

    // For production, integrate with SMS service
    // Example with MSG91 (popular in India):
    /*
    const axios = require('axios');
    const response = await axios.get(`https://api.msg91.com/api/v5/otp`, {
      params: {
        authkey: process.env.MSG91_API_KEY,
        mobile: mobileNumber,
        otp: otp,
        template_id: 'your_template_id'
      }
    });
    return response.data.type === 'success';
    */

    // Example with Twilio:
    /*
    const twilio = require('twilio');
    const client = twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    );
    
    await client.messages.create({
      body: `Your OTP is: ${otp}. Valid for 10 minutes.`,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: `+91${mobileNumber}`
    });
    return true;
    */

    return true;
  } catch (error) {
    console.error('Error sending OTP:', error);
    return false;
  }
};

module.exports = { sendOTP };
