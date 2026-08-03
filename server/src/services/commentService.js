const Comment = require("../models/Comment");
const Task = require("../models/Task");
const Project = require("../models/Project");
const { logActivity } = require("./activityService");
const { generateSignedUrl } = require("./signedUrl");

const signCommentAvatar = async (comment) => {
    if (!comment) return comment;
    const commentObj = typeof comment.toObject === 'function' ? comment.toObject() : comment;

    if (commentObj.user && commentObj.user.avatar && !commentObj.user.avatar.startsWith('http') && !commentObj.user.avatar.startsWith('data:')) {
        try {
            commentObj.user.avatar = await generateSignedUrl(commentObj.user.avatar);
        } catch (err) {
            console.error("Failed to sign comment user avatar:", err);
        }
    }
    return commentObj;
};

const createComment = async ({ taskId, user, commentData }) => {
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

    // Send notifications for comment & mentions
    try {
        const mentionsRegex = /@([a-zA-Z0-9_-]+)/g;
        const matches = comment.content.match(mentionsRegex) || [];
        const mentionedUsernames = [...new Set(matches.map(m => m.substring(1)))];

        const mentionedUserIds = new Set();

        const User = require("../models/User");
        const { notifyMention } = require("../utils/mentionNotifications");
        const { notifyCommentAdded } = require("../utils/commentNotifications");

        for (const username of mentionedUsernames) {
            const mentionedUser = await User.findOne({
                username: { $regex: new RegExp("^" + username + "$", "i") }
            }).select("_id");

            if (mentionedUser) {
                const mentionedUserIdStr = mentionedUser._id.toString();
                mentionedUserIds.add(mentionedUserIdStr);

                // Do not notify commenter themselves
                if (mentionedUserIdStr !== user._id.toString()) {
                    await notifyMention({
                        recipient: mentionedUser._id,
                        sender: user,
                        workspace: project ? project.workspace : null,
                        project: project ? project._id : null,
                        task,
                        comment
                    });
                }
            }
        }

        // Send comment notification to other task assignees who were not explicitly mentioned
        if (task.assignedTo && task.assignedTo.length > 0) {
            for (const assigneeId of task.assignedTo) {
                const assigneeIdStr = assigneeId.toString();
                if (assigneeIdStr !== user._id.toString() && !mentionedUserIds.has(assigneeIdStr)) {
                    await notifyCommentAdded({
                        recipient: assigneeId,
                        sender: user,
                        workspace: project ? project.workspace : null,
                        project: project ? project._id : null,
                        task,
                        comment
                    });
                }
            }
        }
    } catch (notifError) {
        console.error("Failed to send comment/mention notifications:", notifError);
    }

    const populatedComment = await Comment.findById(comment._id)
        .populate("user", "username email avatar");

    return await signCommentAvatar(populatedComment);
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

    return await Promise.all(comments.map(signCommentAvatar));
}

module.exports = {
    createComment,
    getComments,
}