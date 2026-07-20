const mongoose = require("mongoose");

const studySessionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true
  },
  module: {
    type: String,
    enum: ["Task OS", "DSA OS", "Notes OS", "Internship OS", "Dashboard", "Custom Study"],
    default: "Custom Study"
  },
  topic: {
    type: String,
    default: ""
  },
  goal: {
    type: String,
    default: ""
  },
  startTime: {
    type: Date,
    default: Date.now
  },
  endTime: {
    type: Date
  },
  duration: {
    type: Number, // duration in seconds
    default: 0
  },
  mode: {
    type: String,
    enum: ["stopwatch", "timer"],
    default: "stopwatch"
  },
  targetDuration: {
    type: Number, // target duration in seconds (for timer mode)
    default: 0
  },
  completionStatus: {
    type: String,
    enum: ["Yes", "Partially", "No"],
    default: "Yes"
  },
  status: {
    type: String,
    enum: ["completed", "partially_completed", "abandoned", "scheduled", "active", "paused"],
    default: "completed"
  },
  notes: {
    type: String,
    default: ""
  },
  mood: {
    type: Number,
    min: 1,
    max: 5,
    default: 5
  },
  difficulty: {
    type: Number,
    min: 1,
    max: 5,
    default: 3
  },
  relatedTask: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Task"
  },
  relatedNote: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Note"
  },
  relatedRoadmap: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "DSARoadmap"
  },
  relatedTopic: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "DSATopic"
  },
  relatedInternship: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Internship"
  },
  isScheduled: {
    type: Boolean,
    default: false
  },
  scheduledDate: {
    type: Date
  },
  scheduledDurationMinutes: {
    type: Number,
    default: 30
  }
}, {
  timestamps: true
});

module.exports = mongoose.model("StudySession", studySessionSchema);
