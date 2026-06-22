const mongoose = require('mongoose');

const dsaSyncProfileSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  leetcode: { type: String, default: '' },
  codeforces: { type: String, default: '' },
  geeksforgeeks: { type: String, default: '' },
  lastSynced: { type: Date }
}, { timestamps: true });

module.exports = mongoose.model('DSASyncProfile', dsaSyncProfileSchema);