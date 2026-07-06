const crypto = require("crypto");
const InviteLink = require("../models/InviteLink.js");
const Workspace = require("../models/Workspace.js");

const createInviteLink = async (workspaceId, userId) => {
    const workspace = await Workspace.findById(workspaceId);

    if (!workspace) {
        throw new Error("Workspace not found");
    }

    const member = workspace.members.find(
        (m) => m.user.toString() === userId.toString()
    );

    if (!member) {
        throw new Error("You are not a workspace member");
    }

    if (member.role !== "admin" && member.role !== "owner") {
        throw new Error("Only admins can create invite links");
    }

    const token = crypto.randomBytes(32).toString("hex");

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const existingLink = await InviteLink.findOne({
        workspace,
        isActive: true,
        expiresAt: { $gt: new Date() },
    })
    .lean()
    .populate("workspace");

    if (existingLink) {
        return existingLink;
    }

    const inviteLink = await InviteLink.create({
        workspace,
        token,
        createdBy: userId,
        expiresAt,
    });
    return inviteLink;
}

const validateInviteLink = async (token) => {
    const invite = await InviteLink.findOne({
        token,
    }).populate("workspace");

    if (!invite) {
        throw new Error("Invalid invite link");
    }

    if (!invite.isActive) {
        throw new Error("Invite link is inactive");
    }

    if (invite.expiresAt < new Date()) {
        throw new Error("Invite link has expired");
    }
    return invite;
};

const joinWorkspace = async (token, userId) => {

    const invite = await validateInviteLink(token);

    const workspace = invite.workspace;

    const alreadyMember = workspace.members.some(
        member => member.user.toString() === userId.toString()
    );

    if (alreadyMember) {
        throw new Error("You are already a member");
    }

    workspace.members.push({
        user: userId,
        role: invite.role,
    });

    await workspace.save();

    return workspace;
};

module.exports = {
    createInviteLink,
    joinWorkspace,
    validateInviteLink
};