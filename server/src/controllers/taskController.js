const Task = require("../models/Task");
const Project = require("../models/Project"); 
const Column = require("../models/Column");
const taskService = require("../services/taskService");

const createTask = async (req, res, next) => {
    try {
        const task = await taskService.createTask({
            taskData: req.body,
            user: req.user,
            column: req.column,
            project: req.project,
        });
        res.status(201).json(task);
    } catch(error) {
        next(error)
    };
};

const getTasks = async (req, res) => {
  try {
    const userId = req.user._id;
    const tasks = await Task.find({
      $or: [{ createdBy: userId }, { assignedTo: userId }],
    })
      .populate('project')
      .populate('column')
      .populate('assignedTo', 'username email')
      .populate('createdBy', 'username email')
      .sort({ position: 1, createdAt: -1 });
    res.status(200).json(tasks);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getTaskById = async (req, res) => {
    try {
        const task = await Task.findById(req.params.id);
        if (!task) {
            return res.status(404).json({
                message: 'Task not found!'
            });
        }
        res.status(200).json(task);
    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
}

const updateTask = async (req, res) => {
    try {
        const task = await Task.findByIdAndUpdate(
            {
                _id: req.params.id,
                $or: [{ createdBy: req.user._id }, { assignedTo: req.user._id }],
            },
            req.body,
            { new: true }
        );
        if (!task) {
            return res.status(404).json({
                message: 'Task not found or Unauthorized!'
            });
        }
        res.status(200).json(task);
    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
}

const deleteTask = async (req, res) => {
  try {
    let task;
    if (req.user.role === 'admin') {
      task = await Task.findByIdAndDelete(req.params.id);
    } else {
      task = await Task.findOneAndDelete({ _id: req.params.id, createdBy: req.user._id });
    }
    if (!task) return res.status(404).json({ message: 'Task not found or Unauthorized!' });
    res.status(200).json(task);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
    createTask,
    getTasks,
    getTaskById,
    updateTask,
    deleteTask
};