const Motivation = require('../models/Motivation');
const Scan = require('../models/Scan');
const catchAsync = require('../utils/catchAsync');
const { generateMotivation } = require('../services/groqService');

exports.getDailyMotivation = catchAsync(async (req, res) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let motivation = await Motivation.findOne({
    userId: req.user._id,
    date: { $gte: today },
  });

  if (!motivation) {
    const scanCount = await Scan.countDocuments({ userId: req.user._id });
    const message = await generateMotivation({ scanCount });

    motivation = await Motivation.create({
      userId: req.user._id,
      message,
      date: new Date(),
    });
  }

  res.status(200).json({
    success: true,
    data: {
      message: motivation.message,
      generatedAt: motivation.date,
    },
  });
});
