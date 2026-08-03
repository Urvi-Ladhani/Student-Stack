const express = require('express');
const router = express.Router();
const {
  getRoadmaps,
  getTopics,
  getProblems,
  createProblem,
  logAttempt,
  createRoadmap,
  seedDefaultRoadmaps,
  getSyncProfile,
  updateSyncProfile,
  extensionSync,
  toggleStar,syncContests, getContests,
  trackLiveSubmission,
  serverSync
} = require('../controllers/dsaController');

const protect = require('../middleware/authMiddleware'); 

router.post('/seed-defaults', protect, seedDefaultRoadmaps);

router.route('/roadmaps')
  .get(protect, getRoadmaps)
  .post(protect, createRoadmap);

router.get('/topics/:roadmapId', protect, getTopics);

router.route('/problems')
  .get(protect, getProblems)
  .post(protect, createProblem);
router.put('/problems/:id/star', protect, toggleStar);

router.post('/problems/:id/attempt', protect, logAttempt);

// SYNC PROFILE ROUTES
router.route('/sync-profile')
  .get(protect, getSyncProfile)
  .post(protect, updateSyncProfile);

// ==========================================
// EXTENSION SYNC ROUTE
// ==========================================
router.post('/extension-sync', protect, extensionSync);

// ==========================================
// SERVER-SIDE SYNC ROUTE
// ==========================================
router.post('/server-sync', protect, serverSync);

router.get('/contests', protect, getContests);
router.post('/contests/sync', protect, syncContests);

router.post('/problems/track-submission', protect, trackLiveSubmission);

module.exports = router;