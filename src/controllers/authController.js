const crypto = require('crypto');
const User = require('../models/User');
const AppError = require('../utils/AppError');
const catchAsync = require('../utils/catchAsync');
const { generateAccessToken, generateRefreshToken, generateResetToken } = require('../services/tokenService');
const { sendOTPEmail } = require('../services/emailService');
const { generateOTP } = require('../utils/helpers');

exports.signup = catchAsync(async (req, res) => {
  const { name, email, password } = req.body;

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new AppError('Email already registered', 400, 'AUTH_004');
  }

  const user = await User.create({ name, email, password });
  const token = generateAccessToken(user._id);
  const refreshToken = generateRefreshToken(user._id);

  user.refreshToken = refreshToken;
  await user.save({ validateBeforeSave: false });

  res.status(201).json({
    success: true,
    message: 'User registered successfully',
    data: {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
      },
      token,
      refreshToken,
    },
  });
});

exports.login = catchAsync(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email }).select('+password');
  if (!user || !(await user.comparePassword(password))) {
    throw new AppError('Invalid email or password', 401, 'AUTH_001');
  }

  const token = generateAccessToken(user._id);
  const refreshToken = generateRefreshToken(user._id);

  user.refreshToken = refreshToken;
  await user.save({ validateBeforeSave: false });

  res.status(200).json({
    success: true,
    data: {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        profilePic: user.profilePic,
        age: user.age,
        allergies: user.allergies,
        role: user.role,
      },
      token,
      refreshToken,
    },
  });
});

exports.forgotPassword = catchAsync(async (req, res) => {
  const { email } = req.body;

  const user = await User.findOne({ email }).select('+passwordResetOTP +passwordResetOTPExpiry');
  if (!user) {
    throw new AppError('No account found with this email', 404, 'USER_001');
  }

  const otp = generateOTP();
  const hashedOTP = crypto.createHash('sha256').update(otp).digest('hex');

  user.passwordResetOTP = hashedOTP;
  user.passwordResetOTPExpiry = Date.now() + 10 * 60 * 1000;
  await user.save({ validateBeforeSave: false });

  await sendOTPEmail(email, otp);

  res.status(200).json({
    success: true,
    message: 'OTP sent to your email',
  });
});

exports.verifyOtp = catchAsync(async (req, res) => {
  const { email, otp } = req.body;

  const hashedOTP = crypto.createHash('sha256').update(otp).digest('hex');

  const user = await User.findOne({
    email,
    passwordResetOTP: hashedOTP,
    passwordResetOTPExpiry: { $gt: Date.now() },
  }).select('+passwordResetOTP +passwordResetOTPExpiry');

  if (!user) {
    throw new AppError('Invalid or expired OTP', 400, 'AUTH_005');
  }

  const resetToken = generateResetToken(user._id);

  user.passwordResetOTP = undefined;
  user.passwordResetOTPExpiry = undefined;
  await user.save({ validateBeforeSave: false });

  res.status(200).json({
    success: true,
    message: 'OTP verified',
    data: { resetToken },
  });
});

exports.resetPassword = catchAsync(async (req, res) => {
  const { resetToken, newPassword } = req.body;

  let decoded;
  try {
    decoded = require('jsonwebtoken').verify(resetToken, process.env.JWT_SECRET);
  } catch (err) {
    throw new AppError('Invalid or expired reset token', 400, 'AUTH_005');
  }

  if (decoded.purpose !== 'reset') {
    throw new AppError('Invalid reset token', 400, 'AUTH_005');
  }

  const user = await User.findById(decoded.id);
  if (!user) {
    throw new AppError('User not found', 404, 'USER_001');
  }

  user.password = newPassword;
  user.passwordChangedAt = Date.now();
  user.refreshToken = undefined;
  await user.save();

  res.status(200).json({
    success: true,
    message: 'Password reset successful',
  });
});

exports.changePassword = catchAsync(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  const user = await User.findById(req.user.id).select('+password');
  if (!(await user.comparePassword(currentPassword))) {
    throw new AppError('Current password is incorrect', 401, 'AUTH_001');
  }

  user.password = newPassword;
  user.passwordChangedAt = Date.now();
  await user.save();

  const token = generateAccessToken(user._id);
  const refreshToken = generateRefreshToken(user._id);
  user.refreshToken = refreshToken;
  await user.save({ validateBeforeSave: false });

  res.status(200).json({
    success: true,
    message: 'Password changed successfully',
    data: { token, refreshToken },
  });
});
