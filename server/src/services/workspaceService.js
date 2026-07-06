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

const addWorkspaceTag = async ({
  workspaceId,
  tagName,
}) => {
  const workspace =
    await Workspace.findById(workspaceId);

  if (!workspace) {
    throw new Error("Workspace not found");
  }

  const normalizedTag = tagName.trim();

  if (!normalizedTag) {
    throw new Error("Tag name is required");
  }

  const exists =
    workspace.availableTags.some(
      tag =>
        tag.toLowerCase() ===
        normalizedTag.toLowerCase()
    );

  if (!exists) {
    workspace.availableTags.push(
      normalizedTag
    );

    await workspace.save();
  }

  return workspace.availableTags;
};

const getWorkspaceTags = async (
  workspaceId
) => {
  const workspace =
    await Workspace.findById(
      workspaceId
    ).select("availableTags");

  return workspace.tags;
};

module.exports = { createWorkspace, getWorkspaces, addWorkspaceTag, getWorkspaceTags};