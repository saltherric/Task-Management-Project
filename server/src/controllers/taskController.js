const Task = require("../models/Task");
const Project = require("../models/Project"); 
const Column = require("../models/Column");
const taskService = require("../services/taskService");
const { getTasks: getTasksService, updateTask: updateTaskService } = require("../services/taskService");

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

const getTasks = async (req, res, next) => {
    try {
        const tasks = await getTasksService(
            req.params.projectId,
            req.user
        );
        res.status(200).json({
            success: true,
            tasks,
        });
    } catch (error) {
        next(error);
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

const updateTask = async (req, res, next) => {
    try {
        const task = await updateTaskService({
            taskId: req.params.taskId,
            taskData: req.body,
            user: req.user
        });
        res.status(200).json({
            success: true,
            task
        });
    } catch (error) {
        next(error);
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

const moveTask = async (req, res, next) => {
  try {
    const { taskId } = req.params;
    const { columnId } = req.body;

    const task = await Task.findById(taskId);

    task.column = columnId;

    await task.save();

    res.status(200).json({
      success: true,
      task
    });

  } catch (error) {
    next(error);
  }
};

module.exports = {
    createTask,
    getTasks,
    getTaskById,
    updateTask,
    deleteTask,
    moveTask
};