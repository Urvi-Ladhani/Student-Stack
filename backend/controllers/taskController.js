const Task = require('../models/Task');

// Get all active tasks
exports.getTasks = async (req, res) => {
  try {
    const tasks = await Task.find({ 
      userId: req.user._id, 
      isDeleted: false
    }).sort({ deadline: 1 });
    res.json(tasks);
  } catch (error) {
    console.error("❌ GET TASKS ERROR:", error);
    res.status(500).json({ message: 'Server Error fetching tasks' });
  }
};

// Create a task
exports.createTask = async (req, res) => {
  try {
    // Safety check to ensure the user exists in the request
    if (!req.user || !req.user._id) {
      return res.status(401).json({ message: 'User authorization failed' });
    }

    const taskData = { ...req.body, userId: req.user._id };
    const newTask = await Task.create(taskData);
    res.status(201).json(newTask);
  } catch (error) {
    console.error("❌ CREATE TASK ERROR:", error.message);
    res.status(500).json({ message: 'Server Error creating task', error: error.message });
  }
};

// Update a task
exports.updateTask = async (req, res) => {
  try {
    const task = await Task.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      req.body,
      { new: true }
    );
    if (!task) return res.status(404).json({ message: 'Task not found' });
    res.json(task);
  } catch (error) {
    console.error("❌ UPDATE TASK ERROR:", error.message);
    res.status(500).json({ message: 'Server Error updating task' });
  }
};

// Hard Delete a single task
exports.deleteTask = async (req, res) => {
  try {
    const task = await Task.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    if (!task) return res.status(404).json({ message: 'Task not found' });
    res.json({ message: 'Task permanently deleted' });
  } catch (error) {
    console.error("❌ DELETE TASK ERROR:", error.message);
    res.status(500).json({ message: 'Server Error deleting task' });
  }
};

// BULK ACTIONS
exports.bulkComplete = async (req, res) => {
  try {
    await Task.updateMany(
      { _id: { $in: req.body.taskIds }, userId: req.user._id },
      { status: 'done' }
    );
    res.json({ message: 'Tasks marked complete' });
  } catch (error) {
    console.error("❌ BULK COMPLETE ERROR:", error.message);
    res.status(500).json({ message: 'Server Error in bulk complete' });
  }
};

exports.bulkDelete = async (req, res) => {
  try {
    await Task.deleteMany({ _id: { $in: req.body.taskIds }, userId: req.user._id });
    res.json({ message: 'Tasks permanently deleted' });
  } catch (error) {
    console.error("❌ BULK DELETE ERROR:", error.message);
    res.status(500).json({ message: 'Server Error in bulk delete' });
  }
};