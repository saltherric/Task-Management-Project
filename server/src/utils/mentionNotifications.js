export const notifyMention = async ({
  recipient,
  sender,
  workspace,
  project,
  task,
}) => {
  return createNotification({
    recipient,
    sender: sender._id,

    workspace,
    project,
    task: task._id,

    type: "MENTION",

    title: "You were mentioned",

    message: `${sender.username} mentioned you in "${task.title}".`,
  });
};