const Workspace = require("../models/Workspace");
const User = require("../models/User");

const getWorkspaceMembers = async ({workspaceId}) => {
    const workspace = await Workspace.findById(workspaceId)
        .populate("members.user", "username email avatar role")
        .lean();

    if (!workspace) {
        throw new Error("Workspace not found");
    }

    return workspace.members
        .filter(member => member.user)
        .map(member => ({
            ...member.user,
            role: member.role,
            joinedAt: member.joinedAt,
        }));
};

const getAvailableMembers = async ({workspaceId}) => {
    const workspace = await Workspace.findById(workspaceId)
        .select("members.user")
        .lean();

    const memberIds = workspace.members.map(member => member.user);

    const users = await User.find({
        _id: { $nin: memberIds },
    })
        .select("_id username email avatar")
        .lean();
    return users;
};

const invitesMember = async ({ workspaceId, userId }) => {
    const workspace = await Workspace.findById(workspaceId);
    if (!workspace) {
        throw new Error("Workspace not found");
    }

    const user = await User.findById(userId);
    if (!user) {
        throw new Error("User not found");
    }
    
    const updatedWorkspace = await Workspace.findByIdAndUpdate(
        workspaceId,
        {
            $addToSet: {
                members: {
                    user: userId,
                    role: "member",
                },
            },
        },
        {
            new: true,
        }
    ).populate("members.user", "username email avatar");

    return updatedWorkspace;
};

const updateMemberRole = async ({ workspaceId, memberId, role }) => {
  const workspace = await Workspace.findOneAndUpdate(
    {
      _id: workspaceId,
      "members.user": memberId,
    },
    {
      $set: {
        "members.$.role": role,
      },
    },
    {
      new: true,
    }
  );

  return workspace;
};

module.exports = {
    getWorkspaceMembers,
    getAvailableMembers,
    invitesMember,
    updateMemberRole
};