const Project = require("../models/Project");
const Workspace = require("../models/Workspace");

const createProject = async (req, res) => {
  try {
    const { 
        name, 
        description = '', 
        workspace, members = [], 
        sprintEndDate 
    } = req.body;
    if (!name || !workspace) {
        return res.status(400).json({ 
            message: 'name and workspace are required' 
        });
    }
    
    const ws = await Workspace.findById(workspace);
    if (!ws) return res.status(404).json({ message: 'Workspace not found' });

    const memberIds = Array.from(new Set([
      ...members.map(id => id.toString()),
      req.user._id.toString(),
    ]));

    const project = await Project.create({
      name,
      description,
      workspace,
      members: memberIds,
      createdBy: req.user._id,
      sprintEndDate,
    });

    res.status(201).json(project);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { createProject };