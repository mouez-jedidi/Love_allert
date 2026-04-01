const express = require('express');
const router = express.Router();
const {
  register, login, getMe,
  verifyEmail, resendCode,
  sendPhoneOTP, verifyPhoneOTP,
  forgotPassword, verifyResetCode, resetPassword,
  preVerify, checkPreVerify,
} = require('../controllers/authController');
const auth = require('../middleware/auth');
router.post('/pre-verify', preVerify);
router.post('/check-pre-verify', checkPreVerify);
router.post('/register', register);
router.post('/login', login);
router.get('/me', auth, getMe);
router.post('/verify-email', auth, verifyEmail);
router.post('/resend-code', auth, resendCode);
router.post('/send-phone-otp', auth, sendPhoneOTP);
router.post('/verify-phone-otp', auth, verifyPhoneOTP);
router.post('/forgot-password', forgotPassword);
router.post('/verify-reset-code', verifyResetCode);
router.post('/reset-password', resetPassword);

module.exports = router;