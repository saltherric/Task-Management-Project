const Task = require("../models/Task");
const Project = require("../models/Project"); 
const Column = require("../models/Column");
const taskService = require("../services/taskService");
const { getTasks: getTasksService, updateTask: updateTaskService, deleteTask: deleteTaskService, moveTask: moveTaskService } = require("../services/taskService");
const { getProjectForUser } = require("../services/projectAccessService");


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

const getTaskById = async (req, res, next) => {
    try {
        const task = await Task.findById(req.params.id);
        if (!task) {
            return res.status(404).json({
                message: 'Task not found!'
            });
        }
        await getProjectForUser({ projectId: task.project, userId: req.user._id });
        res.status(200).json(task);
    } catch (error) {
        next(error);
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

const deleteTask = async (req, res, next) => {
  try {
    const task = await deleteTaskService({
        taskId: req.params.taskId,
        user: req.user
    });

    res.status(200).json({
        success: true,
        task
    })
  } catch (error) {
    next(error)
  }
};

const moveTask = async (req, res, next) => {
  try {
    const task = await moveTaskService({
        taskId: req.params.taskId,
        columnId: req.body.columnId,
        user: req.user
    })

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
