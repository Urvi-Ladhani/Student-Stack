const mongoose = require('mongoose');

// Embedded schema for tracking individual attempts
const attemptSchema = new mongoose.Schema({
  date: { type: Date, default: Date.now },
  timeTakenMinutes: { type: Number, default: 0 },
  outcome: { type: String, enum: ['solved', 'partial', 'failed'], required: true },
  confidenceRating: { type: Number, min: 1, max: 5, required: true },
  studySessionId: { type: mongoose.Schema.Types.ObjectId, ref: 'StudySession' },
  notes: { type: String, default: '' }
}, { _id: false }); // No need for separate _ids on subdocuments to save space

const dsaProblemSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  topicId: { type: mongoose.Schema.Types.ObjectId, ref: 'DSATopic', required: true },
  title: { type: String, required: true },
  url: { type: String, default: '' },
  platform: { 
    type: String, 
    enum: ['LeetCode', 'Codeforces', 'HackerRank', 'GeeksForGeeks', 'Other'], 
    default: 'LeetCode' 
  },
  difficulty: { type: String, enum: ['easy', 'medium', 'hard'], required: true },
  status: { type: String, enum: ['unsolved', 'attempted', 'solved'], default: 'unsolved' },
  isStarred: { type: Boolean, default: false },
  patterns: [{ type: String }], // e.g., ['Sliding Window', 'Two Pointer']
  
  attempts: [attemptSchema], // The embedded array of attempts
  
  solvedAt: { type: Date, default: null },
  confidenceRating: { type: Number, min: 1, max: 5, default: null }, // From last attempt
  
  // Problem-level spaced repetition (Anki style)
  revisionSchedule: {
    nextRevisionDate: { type: Date, default: null },
    interval: { type: Number, default: 0 },
    easeFactor: { type: Number, default: 2.5 }
  },
  
  noteId: { type: mongoose.Schema.Types.ObjectId, ref: 'Note' },
  taskId: { type: mongoose.Schema.Types.ObjectId, ref: 'Task' }
}, { timestamps: true });

// --- VITAL PERFORMANCE INDEXES ---
// These make sorting and filtering massive lists of problems lightning fast.
dsaProblemSchema.index({ userId: 1, topicId: 1 });
dsaProblemSchema.index({ userId: 1, status: 1 });
dsaProblemSchema.index({ userId: 1, 'revisionSchedule.nextRevisionDate': 1 });
dsaProblemSchema.index({ userId: 1, platform: 1 });

module.exports = mongoose.model('DSAProblem', dsaProblemSchema);