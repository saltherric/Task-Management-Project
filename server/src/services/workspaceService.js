const Workspace = require("../models/Workspace");
const { generateSignedUrl } = require("./signedUrl");

const signWorkspaceAvatars = async (workspace) => {
    if (!workspace) return workspace;
    const wsObj = typeof workspace.toObject === 'function' ? workspace.toObject() : workspace;

    const signUserAvatar = async (user) => {
        if (user && user.avatar && !user.avatar.startsWith('http') && !user.avatar.startsWith('data:')) {
            try {
                user.avatar = await generateSignedUrl(user.avatar);
            } catch (err) {
                console.error("Failed to sign workspace user avatar:", err);
            }
        }
    };

    if (wsObj.owner) await signUserAvatar(wsObj.owner);
    if (wsObj.members && wsObj.members.length > 0) {
        for (let member of wsObj.members) {
            if (member.user) {
                await signUserAvatar(member.user);
            }
        }
    }
    return wsObj;
};

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
    .populate("owner", "username email avatar")
    .populate("members.user", "username email avatar")
    .sort({ createdAt: -1 });
    return Promise.all(workspaces.map(signWorkspaceAvatars));
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