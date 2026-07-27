const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const validate = require('../middleware/validator');
const { authLimiter } = require('../middleware/rateLimiter');
const {
  signupValidation,
  loginValidation,
  forgotPasswordValidation,
  verifyOTPValidation,
  resetPasswordValidation,
  changePasswordValidation,
} = require('../controllers/authValidation');
const { protect } = require('../middleware/auth');

router.post('/signup', authLimiter, signupValidation, validate, authController.signup);
router.post('/login', authLimiter, loginValidation, validate, authController.login);
router.post('/forgot-password', authLimiter, forgotPasswordValidation, validate, authController.forgotPassword);
router.post('/verify-otp', authLimiter, verifyOTPValidation, validate, authController.verifyOtp);
router.post('/reset-password', authLimiter, resetPasswordValidation, validate, authController.resetPassword);
router.post('/change-password', protect, changePasswordValidation, validate, authController.changePassword);

module.exports = router;
