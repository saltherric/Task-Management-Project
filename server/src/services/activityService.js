const Activity = require("../models/Activity");
const { emitToWorkspace } = require("../socket/socketGateway");

const logActivity = async ({
  actor,
  isSystemActor = false,
  systemActorName,
  type,
  targetType,
  targetId,
  targetTitle,
  recipient,
  content,
  sourceBadge,
  workspace,
  project,
  metadata = {},
}) => {
  try {
    const activity = await Activity.create({
      actor,
      isSystemActor,
      systemActorName,
      type,
      targetType,
      targetId,
      targetTitle,
      recipient,
      content,
      sourceBadge,
      workspace,
      project,
      metadata,
    });

    // Populate and emit the activity to the workspace via socket.io
    try {
      const populatedActivity = await Activity.findById(activity._id)
        .populate("actor", "username email avatar")
        .populate("recipient", "username email avatar")
        .populate({
          path: "targetId",
          select: "title name content status priority",
        });

      if (workspace) {
        emitToWorkspace(workspace.toString(), "activity:created", { activity: populatedActivity });
      }
    } catch (emitError) {
      console.error("Failed to emit activity socket event:", emitError);
    }

    return activity;
  } catch (error) {
    console.error("Failed to log activity:", error);
    throw error;
  }
};

const getWorkspaceActivities = async ({
  workspaceId,
  projectId,
  limit = 20,
  page = 1,
}) => {
  const query = { workspace: workspaceId };
  if (projectId) {
    query.project = projectId;
  }

  const skip = (page - 1) * limit;

  const activities = await Activity.find(query)
    .populate("actor", "username email avatar")
    .populate("recipient", "username email avatar")
    .populate({
      path: "targetId",
      select: "title name content status priority",
    })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  return activities;
};

module.exports = {
  logActivity,
  getWorkspaceActivities,
};