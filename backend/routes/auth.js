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

// Routes publiques (sans auth)
router.post('/pre-verify', preVerify);
router.post('/check-pre-verify', checkPreVerify);
router.post('/register', register);
router.post('/login', login);
router.post('/verify-email', verifyEmail);       // <- plus de auth
router.post('/resend-code', resendCode);         // <- plus de auth
router.post('/forgot-password', forgotPassword);
router.post('/verify-reset-code', verifyResetCode);
router.post('/reset-password', resetPassword);

// Routes protégées
router.get('/me', auth, getMe);
router.post('/send-phone-otp', auth, sendPhoneOTP);
router.post('/verify-phone-otp', auth, verifyPhoneOTP);

module.exports = router;