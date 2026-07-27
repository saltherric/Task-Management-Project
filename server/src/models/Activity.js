const mongoose = require("mongoose");
const { Schema } = mongoose;

const ACTIVITY_TYPES = [
  "task_completed",
  "comment_added",
  "reminder_sent",
  "task_assigned",
  "task_created",
  "task_updated",
  "status_changed",
  "member_joined",
  "project_created",
];

const activitySchema = new Schema(
  {
    actor: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: function() {
        return !this.isSystemActor;
      },
    },

    isSystemActor: {
      type: Boolean,
      default: false,
    },
    systemActorName: {
      type: String,
      trim: true,
    },

    type: {
      type: String,
      enum: ACTIVITY_TYPES,
      required: true,
    },

    targetType: {
      type: String,
      enum: ["Task", "Project", "Comment", "Workspace"],
      required: true,
    },
    targetId: {
      type: Schema.Types.ObjectId,
      required: true,
      refPath: "targetType",
    },

    targetTitle: {
      type: String,
      required: true,
      trim: true,
    },

    recipient: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },

    content: {
      type: String,
      trim: true,
      maxlength: 500,
    },

    sourceBadge: {
      type: String,
      trim: true,
    },

    workspace: {
      type: Schema.Types.ObjectId,
      ref: "Workspace",
      required: true,
      index: true,
    },
    project: {
      type: Schema.Types.ObjectId,
      ref: "Project",
      index: true,
    },

    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

activitySchema.index({ workspace: 1, createdAt: -1 });
activitySchema.index({ project: 1, createdAt: -1 });

module.exports = mongoose.model("Activity", activitySchema);
