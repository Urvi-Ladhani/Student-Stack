const express = require('express');
const router = express.Router();
const { getTasks, createTask, updateTaskStatus } = require('../controllers/taskController');

// Notice there are NO curly braces around protect here!
const protect = require('../middleware/authMiddleware'); 

router.route('/')
  .get(protect, getTasks)
  .post(protect, createTask);

router.patch('/:id/status', protect, updateTaskStatus);

module.exports = router;