const { default: mongoose } = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    workspace: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Workspace",
      default: null,
    },

    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      default: null,
    },

    task: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Task",
      default: null,
    },

    type: {
      type: String,
      required: true,
      enum: [
        "TASK_ASSIGNED",
        "TASK_UNASSIGNED",
        "TASK_UPDATED",
        "TASK_MOVED",
        "TASK_COMPLETED",
        "TASK_DELETED",

        "TASK_DUE_SOON",
        "TASK_OVERDUE",

        "COMMENT_ADDED",
        "COMMENT_REPLY",

        "MENTION",

        "PROJECT_ADDED",
        "PROJECT_REMOVED",

        "WORKSPACE_INVITE",
        "WORKSPACE_JOINED",
        "WORKSPACE_ROLE_CHANGED",

        "ATTACHMENT_ADDED",

        "TAG_ADDED",

        "INVITE_ACCEPTED",
      ],
    },

    title: {
      type: String,
      required: true,
    },

    message: {
      type: String,
      required: true,
    },

    isRead: {
      type: Boolean,
      default: false,
    },

    readAt: Date,

    delivery: {
      inApp: {
        isRead: {
          type: Boolean,
          default: false,
        },
      },
      telegram: {
        sent: {
          type: Boolean,
          default: false,
        },
        sentAt: Date,
        error: String,
      },
    },

    invitation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "WorkspaceInvitation",
      default: null,
    },

    actionUrl: {
      type: String,
      default: null,
    },


    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

notificationSchema.index({
    recipient: 1,
    createdAt: -1,
});

notificationSchema.index({
    workspace: 1,
});
notificationSchema.index({
    task: 1,
});
module.exports = mongoose.model("Notification", notificationSchema);