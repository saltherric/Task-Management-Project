const Task = require("../models/Task");
const Notification = require("../models/Notification");
const { createNotification } = require("../services/notificationService");

const checkOverdueTasks = async () => {
    try {
        const now = new Date();

        // 1. Find all active, uncompleted tasks that are past their due date
        const overdueTasks = await Task.find({
            dueDate: { $ne: null, $lt: now },
            status: { $ne: "done" },
            isArchived: false,
        }).populate("project");

        for (const task of overdueTasks) {
            // Find recipients: assignees first, then creator if no assignees
            const recipients = task.assignedTo && task.assignedTo.length > 0
                ? task.assignedTo
                : [task.createdBy];

            for (const recipientId of recipients) {
                // Check if notification already sent
                const alreadyNotified = await Notification.exists({
                    recipient: recipientId,
                    task: task._id,
                    type: "TASK_OVERDUE",
                });

                if (!alreadyNotified) {
                    await createNotification({
                        recipient: recipientId,
                        sender: null, // System notification
                        workspace: task.project?.workspace,
                        project: task.project?._id,
                        task: task._id,
                        type: "TASK_OVERDUE",
                        title: "Task Overdue",
                        message: `"${task.title}" is overdue.`,
                        actionUrl: `/tasks/${task._id}`,
                        metadata: {
                            dueDate: task.dueDate,
                        },
                    });
                }
            }
        }
    } catch (error) {
        console.error("Error in overdue tasks scheduler:", error);
    }
};

const checkDueSoonTasks = async () => {
    try {
        const now = new Date();
        const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

        // Find active, uncompleted tasks due within the next 24 hours
        const dueSoonTasks = await Task.find({
            dueDate: { $ne: null, $gt: now, $lt: tomorrow },
            status: { $ne: "done" },
            isArchived: false,
        }).populate("project");

        for (const task of dueSoonTasks) {
            const recipients = task.assignedTo && task.assignedTo.length > 0
                ? task.assignedTo
                : [task.createdBy];

            for (const recipientId of recipients) {
                const alreadyNotified = await Notification.exists({
                    recipient: recipientId,
                    task: task._id,
                    type: "TASK_DUE_SOON",
                });

                if (!alreadyNotified) {
                    await createNotification({
                        recipient: recipientId,
                        sender: null, // System notification
                        workspace: task.project?.workspace,
                        project: task.project?._id,
                        task: task._id,
                        type: "TASK_DUE_SOON",
                        title: "Task Due Soon",
                        message: `"${task.title}" is due soon.`,
                        actionUrl: `/tasks/${task._id}`,
                        metadata: {
                            dueDate: task.dueDate,
                        },
                    });
                }
            }
        }
    } catch (error) {
        console.error("Error in due soon tasks scheduler:", error);
    }
};

const startOverdueTaskScheduler = () => {
    console.log("⏰ Task due/overdue background scheduler started.");
    
    // Run checks immediately on startup
    checkOverdueTasks();
    checkDueSoonTasks();

    // Check periodically (every 1 hour)
    setInterval(() => {
        checkOverdueTasks();
        checkDueSoonTasks();
    }, 60 * 60 * 1000);
};

module.exports = {
    startOverdueTaskScheduler,
};
