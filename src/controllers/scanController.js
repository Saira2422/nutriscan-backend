const Scan = require('../models/Scan');
const AppError = require('../utils/AppError');
const catchAsync = require('../utils/catchAsync');
const cloudinary = require('../config/cloudinary');
const { analyzeFoodImage } = require('../services/groqService');

exports.analyze = catchAsync(async (req, res) => {
  if (!req.file) {
    throw new AppError('Image is required', 400, 'SCAN_001');
  }

  // Upload buffer to Cloudinary
  const b64 = req.file.buffer.toString('base64');
  const dataURI = `data:${req.file.mimetype};base64,${b64}`;
  const uploadResult = await cloudinary.uploader.upload(dataURI, {
    folder: 'nutriscan',
    resource_type: 'image',
    transformation: [{ width: 1024, height: 1024, crop: 'limit' }, { quality: 'auto' }],
  });
  const imageUrl = uploadResult.secure_url;

  const userContext = {
    allergies: req.user.allergies || [],
    age: req.user.age,
    weight: req.user.weight,
    height: req.user.height,
  };

  const analysis = await analyzeFoodImage(imageUrl, userContext, req.file.buffer, req.file.mimetype);

  const scan = await Scan.create({
    userId: req.user._id,
    productName: analysis.productName || 'Unknown Product',
    productDescription: analysis.productDescription || '',
    productImage: imageUrl,
    productScore: analysis.productScore || 50,
    productScoreStatus: analysis.productScoreStatus || 'moderate',
    productScoreColour: analysis.productScoreColour || 'yellow',
    allIngredients: analysis.allIngredients || [],
    goodIngredients: analysis.goodIngredients || [],
    badIngredients: analysis.badIngredients || [],
    allergenWarnings: analysis.allergenWarnings || [],
    betterAlternatives: analysis.betterAlternatives || [],
    nutritionSummary: analysis.nutritionSummary || {},
    recommendation: analysis.recommendation || '',
    explanation: analysis.explanation || '',
  });

  res.status(200).json({
    success: true,
    data: {
      scanId: scan._id,
      productName: scan.productName,
      productDescription: scan.productDescription,
      productImage: scan.productImage,
      productScore: scan.productScore,
      productScoreStatus: scan.productScoreStatus,
      productScoreColour: scan.productScoreColour,
      allIngredients: scan.allIngredients,
      goodIngredients: scan.goodIngredients,
      badIngredients: scan.badIngredients,
      allergenWarnings: scan.allergenWarnings,
      betterAlternatives: scan.betterAlternatives,
      nutritionSummary: scan.nutritionSummary,
      recommendation: scan.recommendation,
      explanation: scan.explanation,
    },
  });
});

exports.getHistory = catchAsync(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const skip = (page - 1) * limit;

  const filter = { userId: req.user._id };
  if (req.query.status) {
    filter.productScoreStatus = req.query.status;
  }

  const totalScans = await Scan.countDocuments(filter);
  const scans = await Scan.find(filter)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  res.status(200).json({
    success: true,
    data: {
      scans,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalScans / limit),
        totalScans,
        hasNext: page * limit < totalScans,
      },
    },
  });
});

exports.getScan = catchAsync(async (req, res) => {
  const scan = await Scan.findOne({ _id: req.params.scanId, userId: req.user._id });

  if (!scan) {
    throw new AppError('Scan not found', 404, 'SCAN_004');
  }

  res.status(200).json({ success: true, data: scan });
});

exports.deleteScan = catchAsync(async (req, res) => {
  const scan = await Scan.findOneAndDelete({ _id: req.params.scanId, userId: req.user._id });

  if (!scan) {
    throw new AppError('Scan not found', 404, 'SCAN_004');
  }

  res.status(200).json({ success: true, message: 'Scan deleted successfully' });
});
