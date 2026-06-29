const mongoose = require('mongoose');

const noteSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  folderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Folder', default: null },
  title: { type: String, default: 'Untitled Note' },
  content: { type: String, default: '' }, 
  
  // 🔥 FIX: This MUST be String so custom tags like "#Revision" don't crash the server
  tags: [{ type: String }],
  
  sourceModule: { type: String, enum: ['DSA', 'Task', 'Internship', 'General'], default: 'General' },
  editorMode: { type: String, enum: ['text', 'canvas', 'pdf'], default: 'text' },
  isPinned: { type: Boolean, default: false },
  lastEditedAt: { type: Date, default: Date.now }
}, { timestamps: true });

noteSchema.pre('save', function(next) {
  this.lastEditedAt = Date.now();
  next();
});

module.exports = mongoose.model('Note', noteSchema);