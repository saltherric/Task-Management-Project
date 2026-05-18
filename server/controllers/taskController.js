// const { model } = require("mongoose");
const Task = require("../models/Task");

const createTask = async (req, res) => {
    try {
        const task = await Task.create(req.body);
        res.status(201).json(task);
    } catch(error) {
        res.status(500).json({
            message: error.message,
        });
    }
};

const getTasks = async (req, res) => {
    try {
        const tasks = await Task.find();
        res.status(200).json(tasks);
    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
}

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
            req.params.id,
            req.body,
            { new: true }
        );
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

const deleteTask = async (req, res) => {
    try {
        const task = await Task.findByIdAndDelete(req.params.id);
        if (!task) {
            return res.status(404).json({
                message: 'Task not found!'
            });
        };
        res.status(200).json(task);
    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
    

}
module.exports = {
    createTask,
    getTasks,
    getTaskById,
    updateTask,
    deleteTask
}