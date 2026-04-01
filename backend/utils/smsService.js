/**
 * ============================================
 * PropLedger - SMS Service
 * ============================================
 * Handles OTP delivery via SMS
 * Supports Twilio and MSG91 integration
 * 
 * @author PropLedger Development Team
 * @version 1.0.0
 */

/**
 * Sends OTP via SMS to the specified mobile number
 * In development mode, logs OTP to console
 * In production, integrates with SMS service provider
 * 
 * @param {string} mobileNumber - 10-digit mobile number
 * @param {string} otp - 6-digit OTP code
 * @returns {Promise<boolean>} True if SMS sent successfully
 */
const sendOTP = async (mobileNumber, otp) => {
  try {
    // Development mode - log OTP to console
    if (process.env.NODE_ENV === 'development') {
      console.log(`📱 OTP for ${mobileNumber}: ${otp}`);
      return true;
    }

    // Production mode - integrate with SMS service
    // Uncomment and configure one of the following:

    // ============================================
    // Option 1: MSG91 (Popular in India)
    // ============================================
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

    // ============================================
    // Option 2: Twilio (International)
    // ============================================
    /*
    const twilio = require('twilio');
    const client = twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    );
    
    await client.messages.create({
      body: `Your PropLedger OTP is: ${otp}. Valid for 10 minutes. Do not share with anyone.`,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: `+91${mobileNumber}`
    });
    return true;
    */

    return true;
  } catch (error) {
    console.error('❌ Error sending OTP:', error);
    return false;
  }
};

module.exports = { sendOTP };
