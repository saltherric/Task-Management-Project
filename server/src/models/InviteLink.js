const mongoose = require("mongoose");

const inviteLinkSchema = new mongoose.Schema(
{
    workspace: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Workspace",
        required: true,
    },

    token: {
        type: String,
        required: true,
        unique: true,
    },

    role: {
        type: String,
        enum: ["admin", "member"],
        default: "member",
    },

    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },

    expiresAt: {
        type: Date,
        required: true,
    },

    isActive: {
        type: Boolean,
        default: true,
    }
},
{
    timestamps: true,
});

module.exports = mongoose.model("InviteLink", inviteLinkSchema);