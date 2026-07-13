const Project = require('../models/Project');
const Column = require('../models/Column');
const Workspace = require('../models/Workspace');
const { getProjectForUser } = require("../services/projectAccessService");

const taskMiddleware = async ( req, res, next) => {
   try {
    const { project, column } = req.body;
    if(!project || !column){
        return res.status(400).json({
        message:
            'Project and column are required'
        });
    }

    const proj = await getProjectForUser({ projectId: project, userId: req.user._id });

    const col = await Column.findById(column);
    if(!col){
        return res.status(404).json({
        message:
            'Column not found'
        });
    }

    // ensure column belongs to project
    if( col.project.toString() !== proj._id.toString()){
        return res.status(400).json({
            message: 'Column does not belong to this project'
        });
    }

    req.project = proj;
    req.column = col;

    next();
   } catch(error){
    next(error);
   }
};

module.exports = { taskMiddleware };
