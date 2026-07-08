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

const invitesMember = async ({ workspaceId, userId, requesterId, role = "member" }) => {
    const workspace = await Workspace.findById(workspaceId);
    if (!workspace) {
        throw new Error("Workspace not found");
    }

    const user = await User.findById(userId);
    if (!user) {
        throw new Error("User not found");
    }                                                                

    const requester = workspace.members.find(
        (m) => m.user.toString() === requesterId.toString()
    );

    if (!requester) {
        throw new Error("You are not a workspace member");
    }

    if (requester.role !== "admin") {
        throw new Error("Only admins can invite members");
    }
    
    const updatedWorkspace = await Workspace.findByIdAndUpdate(
        workspaceId,
        {
            $addToSet: {
                members: {
                    user: userId,
                    role,
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

const leaveWorkspace = async ({ workspaceId, userId }) => {
    const workspace = await Workspace.findById(workspaceId);

    if (!workspace) {
        throw new Error("Workspace not found");
    }

    const member = workspace.members.find(
        (m) => m.user.toString() === userId.toString()
    );

    if (!member) {
        throw new Error("You are not a member of this workspace");
    }

    // Prevent the last admin from leaving
    if (member.role === "admin") {
        const adminCount = workspace.members.filter(
            (m) => m.role === "admin"
        ).length;

        if (adminCount === 1) {
            throw new Error(
                "You are the last admin. Assign another admin before leaving."
            );
        }
    }

    const updatedWorkspace = await Workspace.findByIdAndUpdate(
        workspaceId,
        {
            $pull: {
                members: {
                    user: userId,
                },
            },
        },
        {
            new: true,
        }
    ).populate("members.user", "username email avatar");

    return updatedWorkspace;
};

module.exports = {
    getWorkspaceMembers,
    getAvailableMembers,
    invitesMember,
    updateMemberRole,
    leaveWorkspace
};