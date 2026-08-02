const Task = require("../models/Task");
const Project = require("../models/Project"); 
const Column = require("../models/Column");
const Workspace = require("../models/Workspace");
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
        const { generateSignedUrl } = require("../services/signedUrl");
        const task = await Task.findById(req.params.id)
            .populate("project", "workspace")
            .populate("createdBy", "username email avatar")
            .populate("assignedTo", "username email avatar")
            .populate("completedBy", "username email avatar")
            .populate("updatedBy", "username email avatar")
            .populate("lastMovedBy", "username email avatar");
        if (!task) {
            return res.status(404).json({
                message: 'Task not found!'
            });
        }
        await getProjectForUser({ projectId: task.project._id || task.project, userId: req.user._id });

        const taskObj = task.toObject();
        const signUserAvatar = async (user) => {
            if (user && user.avatar && !user.avatar.startsWith('http') && !user.avatar.startsWith('data:')) {
                try {
                    user.avatar = await generateSignedUrl(user.avatar);
                } catch (err) {
                    console.error("Failed to sign user avatar in task:", err);
                }
            }
        };
        if (taskObj.createdBy) await signUserAvatar(taskObj.createdBy);
        if (taskObj.completedBy) await signUserAvatar(taskObj.completedBy);
        if (taskObj.updatedBy) await signUserAvatar(taskObj.updatedBy);
        if (taskObj.lastMovedBy) await signUserAvatar(taskObj.lastMovedBy);
        if (taskObj.assignedTo && taskObj.assignedTo.length > 0) {
            for (let user of taskObj.assignedTo) {
                await signUserAvatar(user);
            }
        }

        res.status(200).json(taskObj);
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

const searchTasks = async (req, res, next) => {
    try {
        const query = req.query.q || "";
        if (!query.trim()) {
            return res.status(200).json({ success: true, tasks: [] });
        }

        const userId = req.user._id;

        // 1. Find all workspaces where user is a member
        const workspaces = await Workspace.find({ "members.user": userId });
        const workspaceIds = workspaces.map(w => w._id);

        // 2. Find all projects in those workspaces
        const projects = await Project.find({ workspace: { $in: workspaceIds } });

        // 3. Filter projects where the user has access
        const allowedProjects = projects.filter(project => 
            project.visibility === "workspace" ||
            project.createdBy.toString() === userId.toString() ||
            (project.members || []).some(m => m.user.toString() === userId.toString())
        );
        const allowedProjectIds = allowedProjects.map(p => p._id);

        // 4. Find tasks in those allowed projects matching the query regex
        const searchRegex = new RegExp(query, "i");
        const tasks = await Task.find({
            project: { $in: allowedProjectIds },
            isArchived: false,
            $or: [
                { title: searchRegex },
                { description: searchRegex },
                { tags: searchRegex }
            ]
        })
        .populate("project", "name workspace")
        .populate("column", "name")
        .populate("assignedTo", "username email avatar")
        .sort({ updatedAt: -1 })
        .limit(10);

        res.status(200).json({
            success: true,
            tasks
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
    moveTask,
    searchTasks
};
