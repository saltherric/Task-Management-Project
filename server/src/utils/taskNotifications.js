// Assigned
export const notifyTaskAssigned = async ({
  recipient,
  sender,
  workspace,
  project,
  task,
}) => {
  return await createNotification({
    recipient,
    sender: sender._id,

    workspace,
    project,
    task: task._id,

    type: "TASK_ASSIGNED",

    title: "Task Assigned",

    message: `${sender.username} assigned you "${task.title}".`,

    metadata: {
      priority: task.priority,
    },
  });
};

// Unassigned
export const notifyTaskUnassigned = async ({
  recipient,
  sender,
  workspace,
  project,
  task,
}) => {
  return await createNotification({
    recipient,
    sender: sender._id,

    workspace,
    project,
    task: task._id,

    type: "TASK_UNASSIGNED",

    title: "Task Unassigned",

    message: `${sender.username} removed you from "${task.title}".`,
  });
};

// Task complete
export const notifyTaskCompleted = async ({
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

    type: "TASK_COMPLETED",

    title: "Task Completed",

    message: `${sender.username} completed "${task.title}".`,
  });
};

// Task Moves
export const notifyTaskMoved = async ({
  recipient,
  sender,
  workspace,
  project,
  task,
  fromColumn,
  toColumn,
}) => {
  return createNotification({
    recipient,
    sender: sender._id,

    workspace,
    project,
    task: task._id,

    type: "TASK_MOVED",

    title: "Task Moved",

    message: `${sender.username} moved "${task.title}".`,

    metadata: {
      fromColumn,
      toColumn,
    },
  });
};