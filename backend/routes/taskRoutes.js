const express = require('express');
const router = express.Router();
const { getTasks, createTask, updateTask, deleteTask, bulkComplete, bulkDelete } = require('../controllers/taskController');
const protect = require('../middleware/authMiddleware');

router.route('/')
  .get(protect, getTasks)
  .post(protect, createTask);

router.post('/bulk-complete', protect, bulkComplete);
router.post('/bulk-delete', protect, bulkDelete);

router.route('/:id')
  .patch(protect, updateTask)
  .delete(protect, deleteTask); // THIS MUST BE HERE

module.exports = router;