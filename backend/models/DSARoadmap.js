const mongoose = require('mongoose');

const dsaRoadmapSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    default: null // Null means it's a global "system" roadmap like NeetCode 150
  },
  name: { type: String, required: true },
  type: { type: String, enum: ['system', 'custom'], default: 'custom' },
  description: { type: String, default: '' },
  totalTopics: { type: Number, default: 0 },
  isActive: { type: Boolean, default: false } // Is the user currently tracking this roadmap?
}, { timestamps: true });

module.exports = mongoose.model('DSARoadmap', dsaRoadmapSchema);