const { createNotification } = require("../services/notificationService");

const notifyCommentAdded = async ({
  recipient,
  sender,
  workspace,
  project,
  task,
  comment,
}) => {
  return createNotification({
    recipient,
    sender: sender._id || sender,
    workspace,
    project,
    task: task._id || task,
    type: "COMMENT_ADDED",
    title: "New Comment",
    message: `${sender.username || 'Someone'} commented on "${task.title}".`,
    metadata: {
      commentId: comment._id || comment,
    },
  });
};

module.exports = { notifyCommentAdded };