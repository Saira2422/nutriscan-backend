const User = require('../models/User');
const AppError = require('../utils/AppError');
const catchAsync = require('../utils/catchAsync');

exports.getProfile = catchAsync(async (req, res) => {
  const user = await User.findById(req.user.id);

  res.status(200).json({
    success: true,
    data: {
      id: user._id,
      name: user.name,
      email: user.email,
      profilePic: user.profilePic,
      age: user.age,
      allergies: user.allergies,
      weight: user.weight,
      height: user.height,
      role: user.role,
      createdAt: user.createdAt,
    },
  });
});

exports.updateProfile = catchAsync(async (req, res) => {
  const allowedFields = ['name', 'age', 'weight', 'height', 'allergies', 'profilePic'];
  const updates = {};

  allowedFields.forEach((field) => {
    if (req.body[field] !== undefined) {
      updates[field] = req.body[field];
    }
  });

  const user = await User.findByIdAndUpdate(req.user.id, updates, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    success: true,
    message: 'Profile updated',
    data: {
      id: user._id,
      name: user.name,
      email: user.email,
      profilePic: user.profilePic,
      age: user.age,
      allergies: user.allergies,
      weight: user.weight,
      height: user.height,
      role: user.role,
      createdAt: user.createdAt,
    },
  });
});
