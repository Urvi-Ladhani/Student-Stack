const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  title: { type: String, required: true },
  description: { type: String, default: '' },
  category: { type: String, enum: ['Academic', 'Personal', 'DSA', 'Internship', 'Project'], default: 'Academic' },
  priority: { type: String, enum: ['critical', 'high', 'medium', 'low'], default: 'medium' },
  status: { type: String, enum: ['todo', 'in_progress', 'blocked', 'done'], default: 'todo' },
  deadline: { type: Date, index: true },
  isOverdue: { type: Boolean, default: false },
  estimatedMinutes: { type: Number, default: 30 }
}, { timestamps: true });

module.exports = mongoose.model('Task', taskSchema);