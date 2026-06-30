const mongoose = require('mongoose');

const noteSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  folderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Folder', default: null },
  title: { type: String, default: 'Untitled Note' },
  content: { type: String, default: '' }, 
  
  // Tags as plain Strings so custom text works perfectly
  tags: [{ type: String }],
  
  sourceModule: { type: String, enum: ['DSA', 'Task', 'Internship', 'General'], default: 'General' },
  editorMode: { type: String, enum: ['text', 'canvas', 'pdf'], default: 'text' },
  isPinned: { type: Boolean, default: false },
  
  // Let Mongoose handle the date natively without hooks
  lastEditedAt: { type: Date, default: Date.now }
}, { timestamps: true });

// 🔥 I COMPLETELY DELETED THE noteSchema.pre('save') HOOK THAT WAS CAUSING YOUR "next is not a function" CRASH.

module.exports = mongoose.model('Note', noteSchema);