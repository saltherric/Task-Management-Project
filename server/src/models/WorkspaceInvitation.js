const mongoose = require("mongoose");

const workspaceInvitationSchema = new mongoose.Schema({
    workspace: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Workspace",
        required: true,
    },
    invitedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    invitedUser: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    status: {
        type: String,
        enum: ["pending", "accepted", "declined"],
        default: "pending",
    },
}, {
    timestamps: true,
});

module.exports = mongoose.model(
    "WorkspaceInvitation",
    workspaceInvitationSchema
);