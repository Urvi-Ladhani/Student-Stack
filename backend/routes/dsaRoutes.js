const express = require('express');
const router = express.Router();
const { 
  getRoadmaps, getTopics, getProblems, 
  createProblem, logAttempt, createRoadmap, seedDefaultRoadmaps 
} = require('../controllers/dsaController');

// 👇 IMPORTANT: If this crashes, change it to: const { protect } = require('../middleware/authMiddleware');
const protect = require('../middleware/authMiddleware'); 

router.post('/seed-defaults', protect, seedDefaultRoadmaps);

router.route('/roadmaps')
  .get(protect, getRoadmaps)
  .post(protect, createRoadmap);

router.get('/topics/:roadmapId', protect, getTopics);

router.route('/problems')
  .get(protect, getProblems)
  .post(protect, createProblem);

router.post('/problems/:id/attempt', protect, logAttempt);

const { getSyncProfile, updateSyncProfile } = require('../controllers/dsaController'); // add these to your imports

// SYNC PROFILE ROUTES
router.route('/sync-profile')
  .get(protect, getSyncProfile)
  .post(protect, updateSyncProfile);

module.exports = router;