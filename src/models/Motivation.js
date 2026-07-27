const mongoose = require('mongoose');

const motivationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  message: {
    type: String,
    required: true,
  },
  date: {
    type: Date,
    default: Date.now,
    index: true,
  },
}, {
  timestamps: true,
});

motivationSchema.index({ userId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('Motivation', motivationSchema);
