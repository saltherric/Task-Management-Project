const mongoose = require('mongoose');
const Workspace = require('../src/models/Workspace');

const workspaceMiddleware = async (req, res, next) => {
  try {
  if (!req.user) return res.status(401).json({ message: 'Not authenticated' });

  const workspace = req.body.workspace || req.params.workspace || req.query.workspace;
    if (!workspace) {
        return res.status(400).json({ 
            message: 'Workspace is required' 
        });
    }
    if (!mongoose.Types.ObjectId.isValid(workspace)) {
        return res.status(400).json({ 
            message: 'Invalid workspace id' 
        });
    }

    const existingWorkspace = await Workspace.findById(workspace);
    if (!existingWorkspace) {
        return res.status(404).json({ 
            message: 'Workspace not found' 
        });
    }

    const isMember = existingWorkspace.members.some(
        member => member.user.toString() === req.user._id.toString()
    );
    if (!isMember && req.user.role !== 'admin') {
        return res.status(403).json({ 
            message: 'You are not a member of this workspace' 
        });
    }

    req.workspace = existingWorkspace;
    next();
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { workspaceMiddleware };