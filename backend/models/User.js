const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  // 1. Identity & Auth (Merged your fields + PDF)
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, index: true },
  password: { type: String, required: true }, // Required for your local auth
  avatar: { type: String, default: "" },
  isGoogleConnected: { type: Boolean, default: false },
  tokenVersion: { type: Number, default: 0 },
  
  // 2. Demographics (Your original fields - highly useful for Internship OS)
  university: { type: String, default: "" },
  branch: { type: String, default: "" },
  semester: { type: String, default: "" },
  targetRole: { type: String, default: "" },
  degree: { type: String, default: "" },
  graduationYear: { type: String, default: "" },
  bio: { type: String, default: "" },

  // 3. OS Settings (From Architecture PDF)
  settings: {
    theme: { type: String, enum: ['light', 'dark', 'system'], default: 'dark' },
    pomodoroMinutes: { type: Number, default: 25 },
    breakMinutes: { type: Number, default: 5 },
    timezone: { type: String, default: 'UTC' },
    weekStartsOn: { type: Number, default: 1 }, // 0=Sun, 1=Mon
    defaultTaskView: { type: String, enum: ['list', 'board', 'timeline'], default: 'board' },
    defaultStudySessionDuration: { type: Number, default: 25 },
    defaultDashboardModule: { type: String, default: 'Tasks' },
    defaultLandingPage: { type: String, default: '/dashboard' },
    language: { type: String, default: 'en' },
    dateFormat: { type: String, default: 'MM/DD/YYYY' },
    notificationPreferences: {
      overdueTaskAlert: { type: Boolean, default: true },
      revisionDue: { type: Boolean, default: true },
      applicationDeadline: { type: Boolean, default: true }
    }
  },

  // 4. OS Stats (From Architecture PDF)
  stats: {
    studyStreak: { type: Number, default: 0 },
    longestStreak: { type: Number, default: 0 },
    totalStudyMinutes: { type: Number, default: 0 },
    totalProblemsSolved: { type: Number, default: 0 },
    totalTasksCompleted: { type: Number, default: 0 },
    lastStudyDate: { type: Date }
  },

  studySessions: [{
    date: { type: Date, default: Date.now },
    minutes: { type: Number, required: true }
  }],

  // 5. OS Goals (From Architecture PDF)
  goals: [{
    type: { 
      type: String, 
      enum: ['daily_problems', 'weekly_tasks', 'study_hours', 'applications'] 
    },
    target: { type: Number },
    period: { type: String, enum: ['daily', 'weekly', 'monthly'] },
    active: { type: Boolean, default: true }
  }],

  lastActiveAt: { type: Date, default: Date.now }

}, { 
  // Mongoose automatically adds createdAt and updatedAt timestamps
  timestamps: true 
});

module.exports = mongoose.model("User", userSchema);