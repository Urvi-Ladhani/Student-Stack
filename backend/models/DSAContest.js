const mongoose = require('mongoose');

const dsaContestSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  platform: { type: String, required: true, enum: ['LeetCode', 'Codeforces', 'CodeChef'] },
  contestName: { type: String, required: true },
  date: { type: Date },
  rank: { type: Number },
  ratingChange: { type: Number }, // e.g., +45 or -12
  newRating: { type: Number },
  notes: { type: String, default: '' },
  mistakesLearned: { type: String, default: '' }
}, { timestamps: true });

// Prevent duplicate entries for the same contest
dsaContestSchema.index({ userId: 1, platform: 1, contestName: 1 }, { unique: true });

module.exports = mongoose.model('DSAContest', dsaContestSchema);