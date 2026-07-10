const mongoose = require('mongoose');

const internshipSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  company: { 
    type: String, 
    required: true 
  },
  role: { 
    type: String, 
    required: true 
  },
  // The Kanban Stage
  status: {
    type: String,
    enum: ['wishlist', 'applied', 'oa', 'interview', 'offer', 'rejected'],
    default: 'wishlist'
  },
  
  // 🔌 CHROME EXTENSION DATA
  jobLink: { type: String, default: '' },
  
  // 🟢 NEW FIELDS FOR THE SCRAPER
  location: { type: String, default: 'Not specified' },
  workType: { type: String, default: 'Not specified' },
  stipend: { type: String, default: 'Not specified' },
  
  // 🤖 AI ATS MATCHER DATA
  jobDescription: { type: String, default: '' }, 
  atsScore: { type: Number, default: null }, 
  missingKeywords: [{ type: String }],
  resumeUsed: { type: String, default: '' }, // Which PDF did you send?

  // 📅 TIMELINE
  appliedAt: { type: Date },
  
  // 📝 OA TRACKER (For the Table)
  onlineAssessments: [{
    platform: String, // e.g., HackerRank, CodeSignal
    date: Date,
    status: { type: String, enum: ['Pending', 'Completed', 'Passed', 'Failed'], default: 'Pending' },
    timeLimit: String
  }],

  // 🎙️ INTERVIEW TRACKER (For the Notes Section)
  interviews: [{
    round: String, // e.g., "Technical Phone Screen"
    date: Date,
    notes: String,
    outcome: { type: String, enum: ['Scheduled', 'Passed', 'Failed'], default: 'Scheduled' }
  }]

}, { timestamps: true });

module.exports = mongoose.model('Internship', internshipSchema);