const Notification = require('../models/Notification');
const { sendTelegramMessage } = require("./telegramService");
const User = require("../models/User");

const createNotification = async ({
    recipient,
    sender = null,
    workspace = null,
    project = null,
    task = null,
    invitation = null,
    type,
    title,
    message,
    actionUrl = null,
    metadata = {},
}) => {

    // 1. Save notification to MongoDB
    const notification = await Notification.create({
        recipient,
        sender,
        workspace,
        project,
        task,
        invitation,
        type,
        title,
        message,
        actionUrl,
        metadata,
    });

    // 2. Get recipient information
    const recipientUser = await User.findById(recipient)
        .select("telegram");

    // 3. Send Telegram if connected
    if (
        recipientUser &&
        recipientUser.telegram.connected &&
        recipientUser.telegram.chatId
    ) {
        try {
            const populatedNotification = await Notification.findById(notification._id)
                .populate("workspace")
                .populate("project")
                .populate({
                    path: "task",
                    populate: {
                        path: "assignedTo",
                        select: "username",
                    }
                })
                .populate("sender")
                .populate("recipient");

            let commentText = "";
            if (type === "COMMENT_ADDED" && metadata?.commentId) {
                try {
                    const Comment = require("../models/Comment");
                    const commentDoc = await Comment.findById(metadata.commentId);
                    if (commentDoc) {
                        commentText = commentDoc.content;
                    }
                } catch (err) {
                    console.error("Failed to fetch comment content for Telegram:", err);
                }
            }

            await sendTelegramMessage({
                chatId: recipientUser.telegram.chatId,
                title,
                message,
                actionUrl,
                type,
                workspaceName: populatedNotification.workspace?.name,
                projectName: populatedNotification.project?.name,
                taskTitle: populatedNotification.task?.title,
                taskPriority: populatedNotification.task?.priority,
                taskAssignees: populatedNotification.task?.assignedTo?.map(u => u.username),
                senderName: populatedNotification.sender?.username,
                recipientName: populatedNotification.recipient?.username,
                commentText,
                metadata,
            });

            notification.delivery.telegram.sent = true;
            notification.delivery.telegram.sentAt = new Date();

        } catch (error) {
            notification.delivery.telegram.error = error.message;
        }

        await notification.save();
    }

    // 4. Populate sender & recipient for frontend
    return await notification.populate([
        {
            path: "recipient",
            select: "username avatar",
        },
        {
            path: "sender",
            select: "username avatar",
        },
    ]);
};

const getNotificationsForUser = async ({ userId, limit = 20 }) => {
    return Notification.find({ recipient: userId })
        .populate("sender", "username avatar")
        .sort({ createdAt: -1 })
        .limit(limit);
};

const getUnreadNotificationCount = async ({ userId }) => {
    return Notification.countDocuments({
        recipient: userId,
        isRead: false,
    });
};

const markAllNotificationsAsRead = async ({ userId }) => {
    return Notification.updateMany(
        {
            recipient: userId,
            isRead: false,
        },
        {
            $set: {
                isRead: true,
                readAt: new Date(),
                "delivery.inApp.isRead": true,
            },
        }
    );
};

const markNotificationAsRead = async ({ notificationId, userId }) => {
    return Notification.findOneAndUpdate(
        {
            _id: notificationId,
            recipient: userId,
        },
        {
            $set: {
                isRead: true,
                readAt: new Date(),
                "delivery.inApp.isRead": true,
            },
        },
        {
            new: true,
        }
    ).populate("sender", "username avatar");
};

const deleteNotification = async ({ notificationId, userId }) => {
    return Notification.findOneAndDelete({
        _id: notificationId,
        recipient: userId,
    });
};

module.exports = {
    createNotification,
    getNotificationsForUser,
    getUnreadNotificationCount,
    markAllNotificationsAsRead,
    markNotificationAsRead,
    deleteNotification,
};