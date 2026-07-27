const Comment = require( "../models/Comment");
const Task = require ("../models/Task");
const Project = require("../models/Project");
const { logActivity } = require("./activityService");

const createComment = async({ taskId, user, commentData}) => {
    const task = await Task.findById(taskId);

    if (!task) {
        throw new Error("Task not found");
    }

    if (!commentData?.content?.trim()) {
        throw new Error("Comment content is required")
    }

    const comment = await Comment.create({
        task: taskId,
        user: user._id,
        content: commentData.content.trim(),
    });

    await Task.findByIdAndUpdate(
        taskId,
        { $inc: { commentCount: 1 } }
    );

    const project = await Project.findById(task.project);
    if (project) {
        try {
            await logActivity({
                actor: user._id,
                type: "comment_added",
                targetType: "Comment",
                targetId: comment._id,
                targetTitle: task.title,
                content: comment.content,
                workspace: project.workspace,
                project: project._id,
            });
        } catch (activityError) {
            console.error("Failed to log comment activity:", activityError);
        }
    }

    return await Comment.findById(comment._id)
        .populate("user", "username email avatar");

    return comment;
}

const getComments = async (taskId) => {
   const task = await Task.findById(taskId);

   if (!task) {
      throw new Error("Task not found");
   }

   const comments = await Comment.find({
      task: taskId,
   })
      .populate("user", "username email avatar")
      .sort({ createdAt: 1 });

   return comments;
}

module.exports = {
    createComment,
    getComments,
}