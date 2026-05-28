const Workspace = require("../models/Workspace");

const createWorkspace = async ({ workspaceData, user }) => {
    const workspace = await Workspace.create({
        name: workspaceData.name,
        description: workspaceData.description,
        owner: user._id,
        members: [
            {
                user: user._id,
                role: 'admin'
            }
        ]
    });
    return workspace;
};

module.exports = { createWorkspace };