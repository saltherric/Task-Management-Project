const Activity = require("../models/Activity");
const { emitToWorkspace } = require("../socket/socketGateway");
const { generateSignedUrl } = require("./signedUrl");

const signActivityAvatars = async (activity) => {
    if (!activity) return activity;
    const actObj = typeof activity.toObject === 'function' ? activity.toObject() : activity;

    const signUserAvatar = async (user) => {
        if (user && user.avatar && !user.avatar.startsWith('http') && !user.avatar.startsWith('data:')) {
            try {
                user.avatar = await generateSignedUrl(user.avatar);
            } catch (err) {
                console.error("Failed to sign activity user avatar:", err);
            }
        }
    };

    if (actObj.actor) await signUserAvatar(actObj.actor);
    if (actObj.recipient) await signUserAvatar(actObj.recipient);
    
    return actObj;
};

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
        const signedActivity = await signActivityAvatars(populatedActivity);
        emitToWorkspace(workspace.toString(), "activity:created", { activity: signedActivity });
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

  return Promise.all(activities.map(signActivityAvatars));
};

module.exports = {
  logActivity,
  getWorkspaceActivities,
};