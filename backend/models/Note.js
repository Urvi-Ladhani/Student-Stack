const mongoose = require('mongoose');

const noteSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  folderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Folder', default: null },
  title: { type: String, default: 'Untitled Note' },
  content: { type: String, default: '' },
  tags: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Tag' }],
  
  // 🔥 Module Connections (DSA, Tasks, Internship)
  sourceModule: { 
    type: String, 
    enum: ['DSA', 'Task', 'Internship', 'General'], 
    default: 'General' 
  },
  linkedItemId: { type: mongoose.Schema.Types.ObjectId, default: null }, // e.g., the DSA problem ID
  
  // Toggles
  isPinned: { type: Boolean, default: false },
  isWhiteboard: { type: Boolean, default: false },
  
  lastEditedAt: { type: Date, default: Date.now }
}, { timestamps: true });

// Auto-update lastEditedAt before saving
noteSchema.pre('save', function(next) {
  this.lastEditedAt = Date.now();
  next();
});

module.exports = mongoose.model('Note', noteSchema);