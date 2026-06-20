const Task = require('../models/Task');

// Get all active tasks (not deleted, not archived)
exports.getTasks = async (req, res) => {
  try {
    const tasks = await Task.find({ 
      userId: req.user._id, 
      isDeleted: false,
      isArchived: false 
    }).sort({ deadline: 1 });
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ message: 'Server Error fetching tasks' });
  }
};

exports.createTask = async (req, res) => {
  try {
    const taskData = { ...req.body, userId: req.user._id };
    const newTask = await Task.create(taskData);
    res.status(201).json(newTask);
  } catch (error) {
    res.status(500).json({ message: 'Server Error creating task' });
  }
};

exports.updateTask = async (req, res) => {
  try {
    const task = await Task.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      req.body, // Updates whatever fields are passed (status, title, isDeleted, etc.)
      { new: true }
    );
    if (!task) return res.status(404).json({ message: 'Task not found' });
    res.json(task);
  } catch (error) {
    res.status(500).json({ message: 'Server Error updating task' });
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
    res.status(500).json({ message: 'Server Error in bulk complete' });
  }
};

exports.bulkDelete = async (req, res) => {
  try {
    await Task.updateMany(
      { _id: { $in: req.body.taskIds }, userId: req.user._id },
      { isDeleted: true } // Soft delete
    );
    res.json({ message: 'Tasks deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server Error in bulk delete' });
  }
};