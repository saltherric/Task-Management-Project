export const notifyTaskDueSoon = async ({
  recipient,
  workspace,
  project,
  task,
}) => {
  return createNotification({
    recipient,

    workspace,
    project,
    task: task._id,

    type: "TASK_DUE_SOON",

    title: "Task Due Soon",

    message: `"${task.title}" is due tomorrow.`,

    metadata: {
      dueDate: task.dueDate,
    },
  });
};