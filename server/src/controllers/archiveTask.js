const { response } = require("express");
const taskService = require("../services/taskService");

const archiveTask = async (req, res, next) => {
    try {
        const task = await taskService.archiveTask(
            req.params.id,
            req.user._id
        );
        res.status(200).json({
            success: true,
            task,
        });
    } catch (error) {
        next(error);
    }
};

const unarchiveTask = async (req, res, next) => {
    try {
        const task = await taskService.unarchiveTask(
            req.params.id
        );
        res.status(200).json({
            success: true,
            task,
        });
    } catch (error) {
        next(error);
    }   
};

const getArchivedTasks = async (req, res, next) => {
    try {
        const tasks = await taskService.getArchivedTasks(
            req.params.projectId
        );
        res.status(200).json({
            success: true,
            task
        });
    } catch (error) {
        next(error)
    }
};

module.exports = {
    archiveTask,
    unarchiveTask,
    getArchivedTasks,
}