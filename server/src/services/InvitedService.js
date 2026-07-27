const Workspace = require("../models/Workspace");
const User = require("../models/User");
const { generateSignedUrl } = require("./signedUrl");

const signUserAvatar = async (user) => {
    if (!user) return user;
    if (user.avatar && !user.avatar.startsWith('http') && !user.avatar.startsWith('data:')) {
        try {
            user.avatar = await generateSignedUrl(user.avatar);
        } catch (err) {
            console.error("Failed to sign user avatar:", err);
        }
    }
    return user;
};

const getWorkspaceMembers = async ({workspaceId}) => {
    const workspace = await Workspace.findById(workspaceId)
        .populate("members.user", "username email avatar role")
        .lean();

    if (!workspace) {
        throw new Error("Workspace not found");
    }

    const members = workspace.members
        .filter(member => member.user)
        .map(member => ({
            ...member.user,
            role: member.role,
            joinedAt: member.joinedAt,
        }));

    return Promise.all(members.map(signUserAvatar));
};

const updateWorkspace = async ({ workspaceId, workspaceData, user }) => {
    const workspace = await Workspace.findById(workspaceId);

    if (!workspace) {
        throw new Error("Workspace not found");
    }

    const currentMember = workspace.members.find(
        (member) => member.user.toString() === user._id.toString()
    );

    if (!currentMember || currentMember.role !== "admin") {
        throw new Error("Only workspace admins can update the workspace");
    }

    // Only allow specific fields to be updated
    const allowedFields = ["name", "description"];

    allowedFields.forEach((field) => {
        if (workspaceData[field] !== undefined) {
            workspace[field] = workspaceData[field];
        }
    });

    await workspace.save();

    return workspace;
};

const deleteWorkspace = async ({ workspaceId, user }) => {
    const workspace = await Workspace.findById(workspaceId);

    if (!workspace) {
        throw new Error("Workspace not found");
    }

    const currentMember = workspace.members.find(
        (member) => member.user.toString() === user._id.toString()
    );

    if (!currentMember || currentMember.role !== "admin") {
        throw new Error("Only workspace admins can delete this workspace");
    }

    await Workspace.findByIdAndDelete(workspaceId);

    return true;
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
    return Promise.all(users.map(signUserAvatar));
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
    updateWorkspace,
    deleteWorkspace,
    invitesMember,
    updateMemberRole,
    leaveWorkspace
};