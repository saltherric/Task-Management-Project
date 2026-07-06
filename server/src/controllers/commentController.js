const {createComment: createCommentService, getComments: getCommentsService } = require("../services/commentService");
const Task = require("../models/Task");
const Project = require("../models/Project");
const { emitToWorkspace } = require("../socket/socketGateway");

const resolveWorkspaceIdFromTask = async (taskId) => {
    const task = await Task.findById(taskId).select("project");
    if (!task?.project) return null;

    const project = await Project.findById(task.project).select("workspace");
    return project?.workspace?.toString() || null;
};

const createComment = async (req, res, next) => {
    try {
        const comment = await createCommentService({
            taskId: req.params.taskId,
            user: req.user,
            commentData: req.body,
        });

        const workspaceId = await resolveWorkspaceIdFromTask(req.params.taskId);
        if (workspaceId) {
            emitToWorkspace(workspaceId, "comment:created", {
                comment,
                taskId: req.params.taskId,
                actorId: req.user?._id?.toString(),
            });
        }

        res.status(200).json({
            success: true,
            comment,
        });
    } catch (error) {
        next(error);
    }
};

const getComments = async (req, res, next) => {
    try {
        const comments = await getCommentsService(req.params.taskId);
        res.status(200).json({
            success: true,
            comments,
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    createComment,
    getComments,
};