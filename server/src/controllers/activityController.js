const { getWorkspaceActivities } = require("../services/activityService");

const getActivities = async (req, res, next) => {
  try {
    // workspaceMiddleware validates membership and attaches the workspace to req.workspace
    const workspaceId = req.workspace._id;

    const projectId = req.query.project || req.query.projectId;
    const limit = parseInt(req.query.limit, 10) || 20;
    const page = parseInt(req.query.page, 10) || 1;

    const activities = await getWorkspaceActivities({
      workspaceId,
      projectId,
      limit,
      page,
    });

    res.status(200).json({
      success: true,
      activities,
      page,
      limit,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getActivities,
};
