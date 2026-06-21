const express = require('express');
const router = express.Router();
const { 
  getRoadmaps, 
  getTopics, 
  getProblems, 
  createProblem, 
  logAttempt 
} = require('../controllers/dsaController');
const protect = require('../middleware/authMiddleware');

// Roadmap Routes
router.get('/roadmaps', protect, getRoadmaps);
router.get('/topics/:roadmapId', protect, getTopics);

// Problem Routes
router.route('/problems')
  .get(protect, getProblems)
  .post(protect, createProblem);

// Attempt Route (The Spaced Repetition Trigger)
router.post('/problems/:id/attempt', protect, logAttempt);

module.exports = router;