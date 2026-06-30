const mongoose = require('mongoose');

const noteSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  folderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Folder', default: null },
  title: { type: String, default: 'Untitled Note' },
  content: { type: String, default: '' }, 
  tags: [{ type: String }],
  
  // 🔥 BUG FIXED: Renamed "type" to "attachmentType" so Mongoose doesn't crash!
  attachments: [{
    attachmentType: { type: String, default: 'link' }, 
    url: { type: String, required: true },
    title: { type: String, default: 'Attachment' }
  }],
  
  sourceModule: { type: String, enum: ['DSA', 'Task', 'Internship', 'General'], default: 'General' },
  editorMode: { type: String, enum: ['text', 'canvas', 'pdf'], default: 'text' },
  isPinned: { type: Boolean, default: false },
  lastEditedAt: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('Note', noteSchema);