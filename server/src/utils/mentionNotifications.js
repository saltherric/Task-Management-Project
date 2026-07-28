const { createNotification } = require("../services/notificationService");

const notifyMention = async ({
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
    type: "MENTION",
    title: "You were mentioned",
    message: `${sender.username || 'Someone'} mentioned you in a comment on "${task.title}".`,
    metadata: {
      commentId: comment?._id || comment,
    },
  });
};

module.exports = { notifyMention };