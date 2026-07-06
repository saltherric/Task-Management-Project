export const notifyCommentAdded = async ({
  recipient,
  sender,
  workspace,
  project,
  task,
  comment,
}) => {
  return createNotification({
    recipient,
    sender: sender._id,

    workspace,
    project,
    task: task._id,

    type: "COMMENT_ADDED",

    title: "New Comment",

    message: `${sender.username} commented on "${task.title}".`,

    metadata: {
      commentId: comment._id,
    },
  });
};