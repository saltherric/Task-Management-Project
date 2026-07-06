export const notifyWorkspaceRoleChanged = async ({
  recipient,
  sender,
  workspace,
  role,
}) => {
  return createNotification({
    recipient,
    sender: sender._id,

    workspace,

    type: "WORKSPACE_ROLE_CHANGED",

    title: "Role Updated",

    message: `${sender.username} changed your role to ${role}.`,

    metadata: {
      role,
    },
  });
};