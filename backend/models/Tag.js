const mongoose = require('mongoose');

const tagSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  color: {
    type: String,
    default: 'emerald' // Determines the pill color in the UI
  }
}, { timestamps: true });

module.exports = mongoose.model('Tag', tagSchema);