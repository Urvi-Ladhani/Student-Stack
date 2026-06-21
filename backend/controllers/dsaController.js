const DSARoadmap = require('../models/DSARoadmap');
const DSATopic = require('../models/DSATopic');
const DSAProblem = require('../models/DSAProblem');

// 1. Get all Roadmaps (System defaults + User's custom roadmaps)
exports.getRoadmaps = async (req, res) => {
  try {
    const roadmaps = await DSARoadmap.find({
      $or: [{ userId: req.user._id }, { type: 'system' }]
    });
    res.json(roadmaps);
  } catch (error) {
    console.error("❌ GET ROADMAPS ERROR:", error);
    res.status(500).json({ message: 'Server Error fetching roadmaps' });
  }
};

// 2. Get Topics for a specific Roadmap
exports.getTopics = async (req, res) => {
  try {
    const topics = await DSATopic.find({ roadmapId: req.params.roadmapId }).sort({ order: 1 });
    res.json(topics);
  } catch (error) {
    console.error("❌ GET TOPICS ERROR:", error);
    res.status(500).json({ message: 'Server Error fetching topics' });
  }
};

// 3. Get all Problems for the user
exports.getProblems = async (req, res) => {
  try {
    const problems = await DSAProblem.find({ userId: req.user._id }).sort({ createdAt: -1 });
    res.json(problems);
  } catch (error) {
    console.error("❌ GET PROBLEMS ERROR:", error);
    res.status(500).json({ message: 'Server Error fetching problems' });
  }
};

// 4. Add a new Problem
exports.createProblem = async (req, res) => {
  try {
    const problemData = { ...req.body, userId: req.user._id };
    const newProblem = await DSAProblem.create(problemData);
    res.status(201).json(newProblem);
  } catch (error) {
    console.error("❌ CREATE PROBLEM ERROR:", error);
    res.status(500).json({ message: 'Server Error creating problem' });
  }
};

// 5. Log an Attempt & Calculate Spaced Repetition
exports.logAttempt = async (req, res) => {
  try {
    const { outcome, confidenceRating, timeTakenMinutes, notes } = req.body;
    const problem = await DSAProblem.findOne({ _id: req.params.id, userId: req.user._id });

    if (!problem) return res.status(404).json({ message: 'Problem not found' });

    // Create the attempt record
    const newAttempt = { outcome, confidenceRating, timeTakenMinutes, notes, date: new Date() };
    problem.attempts.push(newAttempt);

    // Update base problem stats
    problem.status = outcome === 'solved' ? 'solved' : 'attempted';
    problem.confidenceRating = confidenceRating;
    if (outcome === 'solved' && !problem.solvedAt) {
      problem.solvedAt = new Date();
    }

    // --- SPACED REPETITION ALGORITHM ---
    let interval = problem.revisionSchedule.interval || 0;
    let easeFactor = problem.revisionSchedule.easeFactor || 2.5;

    if (confidenceRating >= 3) {
      // Good rating: Increase interval
      if (interval === 0) interval = 1;
      else if (interval === 1) interval = 6;
      else interval = Math.round(interval * easeFactor);
      
      // Adjust ease factor slightly based on confidence
      easeFactor = easeFactor + (0.1 - (5 - confidenceRating) * (0.08 + (5 - confidenceRating) * 0.02));
    } else {
      // Poor rating: Reset interval to 1 day, drop ease factor slightly
      interval = 1;
      easeFactor = Math.max(1.3, easeFactor - 0.2); // Never drop ease below 1.3
    }

    // Calculate next revision date
    const nextRevision = new Date();
    nextRevision.setDate(nextRevision.getDate() + interval);

    // Save schedule to problem
    problem.revisionSchedule = { nextRevisionDate: nextRevision, interval, easeFactor };

    await problem.save();
    res.json(problem);

  } catch (error) {
    console.error("❌ LOG ATTEMPT ERROR:", error);
    res.status(500).json({ message: 'Server Error logging attempt' });
  }
};