const mongoose = require('mongoose');

const dsaSyncProfileSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  leetcode: { type: String, default: '' },
  codeforces: { type: String, default: '' },
  geeksforgeeks: { type: String, default: '' },
  lastSyncAt: { type: Date, default: null },
  rawStats: {
    leetcode: { type: Number, default: 0 },
    codeforces: { type: Number, default: 0 },
    gfg: { type: Number, default: 0 }
  }
}, { timestamps: true });

module.exports = mongoose.model('DSASyncProfile', dsaSyncProfileSchema);