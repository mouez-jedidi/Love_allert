const twilio = require('twilio');

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);
const sendOTP = async (phoneNumber) => {
  try {
    const verification = await client.verify.v2
      .services(process.env.TWILIO_VERIFY_SID)
      .verifications.create({
        to: phoneNumber,
        channel: 'sms',
      });
    console.log('✅ OTP sent:', verification.status);
    return { success: true, status: verification.status };
  } catch (err) {
    console.log('❌ OTP error full:', JSON.stringify(err));
    console.log('❌ OTP error message:', err.message);
    console.log('❌ OTP error code:', err.code);
    return { success: false, error: err.message };
  }
};

const verifyOTP = async (phoneNumber, code) => {
  try {
    const result = await client.verify.v2
      .services(process.env.TWILIO_VERIFY_SID)
      .verificationChecks.create({
        to: phoneNumber,
        code,
      });
    console.log('✅ OTP verified:', result.status);
    return { success: result.status === 'approved' };
  } catch (err) {
    console.log('❌ OTP verify error:', err.message);
    return { success: false, error: err.message };
  }
};

module.exports = { sendOTP, verifyOTP };