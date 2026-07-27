const mongoose = require('mongoose');

const scanSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required'],
    index: true,
  },
  productName: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true,
  },
  productDescription: {
    type: String,
    default: '',
  },
  productImage: {
    type: String,
    required: [true, 'Product image URL is required'],
  },
  productScore: {
    type: Number,
    required: [true, 'Product score is required'],
    min: [0, 'Score cannot be less than 0'],
    max: [100, 'Score cannot exceed 100'],
  },
  productScoreStatus: {
    type: String,
    required: true,
    enum: ['good', 'moderate', 'bad'],
  },
  productScoreColour: {
    type: String,
    required: true,
    enum: ['green', 'yellow', 'red'],
  },
  allIngredients: [{ type: String, trim: true }],
  goodIngredients: [{ type: String, trim: true }],
  badIngredients: [{ type: String, trim: true }],
  allergenWarnings: [{
    ingredient: String,
    severity: { type: String, enum: ['safe', 'caution', 'dangerous'] },
    message: String,
  }],
  betterAlternatives: [{ type: String, trim: true }],
  nutritionSummary: {
    calories: { type: String, default: 'N/A' },
    protein: { type: String, default: 'N/A' },
    fat: { type: String, default: 'N/A' },
    carbs: { type: String, default: 'N/A' },
    sugar: { type: String, default: 'N/A' },
    sodium: { type: String, default: 'N/A' },
    fiber: { type: String, default: 'N/A' },
    servingSize: { type: String, default: 'N/A' },
  },
  recommendation: { type: String, default: '' },
  explanation: { type: String, default: '' },
}, {
  timestamps: true,
});

scanSchema.index({ userId: 1, createdAt: -1 });
scanSchema.index({ userId: 1, productScoreStatus: 1 });
scanSchema.index({ productName: 'text' });

module.exports = mongoose.model('Scan', scanSchema);
