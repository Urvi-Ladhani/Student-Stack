const mongoose = require('mongoose');

const resumeSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  versionName: { 
    type: String, 
    required: true 
  },
  fileUrl: { 
    type: String, 
    required: true // Points to the PDF in your uploads folder
  },
  useCount: { 
    type: Number, 
    default: 0 // Tracks how many applications used this specific resume
  }
}, { timestamps: true });

module.exports = mongoose.model('Resume', resumeSchema);