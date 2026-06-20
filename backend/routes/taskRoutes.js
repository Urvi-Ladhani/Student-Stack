const express = require('express');
const router = express.Router();
const { getTasks, createTask, updateTask, bulkComplete, bulkDelete } = require('../controllers/taskController');
const protect = require('../middleware/authMiddleware');

router.route('/')
  .get(protect, getTasks)
  .post(protect, createTask);

// Bulk actions MUST come before /:id routes to prevent Express from thinking "bulk-complete" is an ID
router.post('/bulk-complete', protect, bulkComplete);
router.post('/bulk-delete', protect, bulkDelete);

router.route('/:id')
  .patch(protect, updateTask); // Merged all updates (status, soft delete, edit) into one powerful route

module.exports = router;