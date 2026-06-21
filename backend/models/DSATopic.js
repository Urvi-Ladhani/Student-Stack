const mongoose = require('mongoose');

const dsaTopicSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  roadmapId: { type: mongoose.Schema.Types.ObjectId, ref: 'DSARoadmap', required: true },
  name: { type: String, required: true },
  description: { type: String, default: '' },
  order: { type: Number, default: 0 }, // To keep topics in a specific learning sequence
  prerequisites: [{ type: mongoose.Schema.Types.ObjectId, ref: 'DSATopic' }],
  status: { 
    type: String, 
    enum: ['not_started', 'in_progress', 'completed', 'revising'], 
    default: 'not_started' 
  },
  masteryScore: { type: Number, min: 0, max: 100, default: 0 },
  problemCount: { type: Number, default: 0 },
  solvedCount: { type: Number, default: 0 },
  noteIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Note' }],
  
  // Topic-level spaced repetition
  revisionSchedule: {
    nextRevisionDate: { type: Date, default: null },
    interval: { type: Number, default: 0 }, // days
    easeFactor: { type: Number, default: 2.5 }
  }
}, { timestamps: true });

module.exports = mongoose.model('DSATopic', dsaTopicSchema);