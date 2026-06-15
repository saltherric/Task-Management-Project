const Comment = require( "../models/Comment");
const Task = require ("../models/Task");

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

    return await Comment.findById(comment._id)
        .populate("user", "username email");

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
      .populate("user", "username email")
      .sort({ createdAt: 1 });

   return comments;
}

module.exports = {
    createComment,
    getComments,
}