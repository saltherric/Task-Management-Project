const mongoose = require('mongoose');
const Project = require("../models/Project");
const Column = require("../models/Column");

const validateProjectAndColumn = async (req, res, next) => {
    try {
        const { project, column } = req.body;
        if (!project || !column) {
            return res.status(400).json({ message: 'project and column are required' });
        }

        // validate id format
        if (!mongoose.Types.ObjectId.isValid(project) || !mongoose.Types.ObjectId.isValid(column)) {
            return res.status(400).json({ message: 'Invalid project or column id' });
        }

        // Validate project and column
        const proj = await Project.findById(project);
        if (!proj) {
            return res.status(404).json({ message: 'Project not found' });
        }

        // ensure requester is a member of the project or an admin
        const isMember = Array.isArray(proj.members) && proj.members.map(m => m.toString()).includes(req.user._id.toString());
        if (!isMember && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'You are not a member of this project' });
        }

        const col = await Column.findById(column);
        if (!col || col.project.toString() !== project) {
            return res.status(404).json({ message: 'Column not found in project' });
        }

        req.project = proj;
        req.column = col;
        next();
    } catch (error) {
       res.status(500).json({ message: error.message });
    }
};

module.exports = { validateProjectAndColumn };