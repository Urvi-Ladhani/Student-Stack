const Task = require('../models/Task');

exports.getTasks = async (req, res) => {
  try {
    const tasks = await Task.find({ userId: req.user._id }).sort({ deadline: 1 });
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

exports.updateTaskStatus = async (req, res) => {
  try {
    const task = await Task.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { status: req.body.status },
      { new: true }
    );
    if (!task) return res.status(404).json({ message: 'Task not found' });
    res.json(task);
  } catch (error) {
    res.status(500).json({ message: 'Server Error updating task' });
  }
};