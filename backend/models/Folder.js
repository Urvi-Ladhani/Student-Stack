const mongoose = require('mongoose');

const folderSchema = new mongoose.Schema({
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
  parentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Folder',
    default: null // If null, it's a top-level folder (e.g., "Semester 5")
  },
  icon: {
    type: String,
    default: '📁' 
  },
  color: {
    type: String,
    default: 'blue' // For glassmorphism glow effects
  }
}, { timestamps: true });

module.exports = mongoose.model('Folder', folderSchema);