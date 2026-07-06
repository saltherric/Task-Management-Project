const WorkspaceInvitation = require("../models/WorkspaceInvitation");
const Workspace = require("../models/Workspace");
const User = require("../models/User");

const createInvitation = async ({ workspaceId, invitedBy, invitedUser }) => {
    const workspace = Workspace.findById(workspaceId);
    if (!workspace) throw new Error("Workspace not found");

    const user = User.findById(invitedUser);
    if (!user) throw new Error("User not found");

    if (invitedBy.toString() === invitedUser.toString()) {
        throw new Error("Cannot invite yourself");
    }

    const alreadyMember = workspace.members.some(
        member => member.user.toString() === invitedUser.toString()
    );
    if (alreadyMember) {
        throw new Error("User is already a member of this workspace.")
    }

    const existingInvitation = await WorkspaceInvitation.findOne({
        workspace: workspaceId,
        invitedUser,
        status: "pending",
    });
    if (existingInvitation) {
        throw new Error("User already has a pending invitation.");
    }

    const invitation = await WorkspaceInvitation.create({
        workspace: workspaceId,
        invitedBy,
        invitedUser,
    });

    const sender = workspace.members.find(
        member => member.user.toString() === invitedBy.toString()
    );

    if (!sender) {
        throw new Error("You are not a member of this workspace.");
    }

    return await invitation.populate([
        {
            path: "workspace",
            select: "name"
        },
        {
            path: "invitedBy",
            select: "username email avatar",
        },
        {
            path: "invitedUser",
            select: "username email avatar",
        }
    ]);
};

const getMyInvitation = async ({ userId }) => {
    return await WorkspaceInvitation.find({
        invitedUser: userId,
        status: "pending",
    })
        .populate("workspace", "name")
        .populate("invitedBy", "username email avatar")
        .sort({ createdAt: -1 });
};

const acceptInvitation = async ({ invitationId, userId }) => {
    const invitation = await WorkspaceInvitation.findById(invitationId)
        .populate("workspace", "name");
    if (!invitation) {
        throw new Error("Invitation not found.");
    }

    if (invitation.invitedUser.toString() !== userId.toString()) {
        throw new Error("Unauthorized.");
    }

    // Check if it's still pending
    if (invitation.status !== "pending") {
        throw new Error("Invitation has already been processed.");
    }

    // Add user to workspace
    await Workspace.findByIdAndUpdate(
        invitation.workspace._id,
        {
            $addToSet: {
                members: {
                    user: userId,
                    role: "member",
                    joinedAt: new Date(),
                },
            },
        }
    );

    // Update invitation status
    invitation.status = "accepted";
    await invitation.save();

    return invitation;
};

const declineInvitation = async ({ invitationId, userId }) => {
    const invitation = await WorkspaceInvitation.findById(invitationId);

    if (!invitation) {
        throw new Error("Invitation not found.");
    }

    // Make sure the invitation belongs to the logged-in user
    if (invitation.invitedUser.toString() !== userId.toString()) {
        throw new Error("Unauthorized.");
    }

    // Check if it's still pending
    if (invitation.status !== "pending") {
        throw new Error("Invitation has already been processed.");
    }

    // Update invitation status
    invitation.status = "declined";
    await invitation.save();

    return invitation;
};

const cancelInvitation = async ({ invitationId, userId }) => {
    const invitation = await WorkspaceInvitation.findById(invitationId);
    if (!invitation) {
        throw new Error("Invitation not found.");
    }
    if (invitation.status !== "pending") {
        throw new Error("This invitation has already been processed.");
    }

    const workspace = await Workspace.findById(invitation.workspace);
    if (!workspace) {
        throw new Error("Workspace not found.");
    }

    const member = workspace.members.find(
        member => member.user.toString() === userId.toString()
    );
    if (!member) {
        throw new Error("You are not a member of this workspace.");
    }
    // Only owner/admin can cancel invitations
    if (!["owner", "admin"].includes(member.role)) {
        throw new Error("You don't have permission to cancel invitations.");
    }

    await invitation.deleteOne();

    return {
        message: "Invitation cancelled successfully.",
    };
};

const getWorkspaceInvitations = async ({ workspaceId, userId }) => {
    const workspace = await Workspace.findById(workspaceId);

    if (!workspace) {
        throw new Error("Workspace not found.");
    }

    // Check that the requester belongs to the workspace
    const member = workspace.members.find(
        member => member.user.toString() === userId.toString()
    );

    if (!member) {
        throw new Error("You are not a member of this workspace.");
    }

    // Only owner/admin can view invitations
    if (!["owner", "admin"].includes(member.role)) {
        throw new Error("You don't have permission to view invitations.");
    }

    const invitations = await WorkspaceInvitation.find({
        workspace: workspaceId,
        status: "pending",
    })
        .populate("invitedUser", "username email avatar")
        .populate("invitedBy", "username")
        .sort({ createdAt: -1 });

    return invitations;
};

module.exports = {
    createInvitation,
    getMyInvitations,
    acceptInvitation,
    declineInvitation,
    cancelInvitation,
};