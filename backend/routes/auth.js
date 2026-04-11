const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const auth = require('../middleware/auth');

// Routes publiques
router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/pre-verify', authController.preVerify);           // <-- Ajouter
router.post('/check-pre-verify', authController.checkPreVerify); // <-- Ajouter
router.post('/forgot-password', authController.forgotPassword);
router.post('/verify-reset-code', authController.verifyResetCode);
router.post('/reset-password', authController.resetPassword);

// Routes protégées
router.post('/verify-email', auth, authController.verifyEmail);
router.post('/resend-code', auth, authController.resendCode);
router.post('/send-phone-otp', auth, authController.sendPhoneOTP);
router.post('/verify-phone-otp', auth, authController.verifyPhoneOTP);
router.get('/me', auth, authController.getMe);

module.exports = router;