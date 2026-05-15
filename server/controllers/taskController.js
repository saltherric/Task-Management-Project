// const { model } = require("mongoose");
const Task = require("../models/Task");

const createTask = async (req, res) => {
    try {
        const { title, description, priority, status } = req.body;
        const task = await Task.create({
            title,
            description,
            priority,
            status,
        });
        res.status(201).json(task);
    } catch(error) {
        res.status(500).json({
            message: error.message,
        });
    }
};

module.exports = {
    createTask,
}