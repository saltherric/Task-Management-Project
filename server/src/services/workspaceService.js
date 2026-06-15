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

const getWorkspaces = async ( {user} ) => {
    const workspaces = await Workspace.find({
        'members.user' : user._id
    })
    .populate("owner", "username email")
    .populate("members.user", "username email")
    .sort({ createdAt: -1 });
    return workspaces;
}

module.exports = { createWorkspace, getWorkspaces};