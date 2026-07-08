import API from "./api";

export const createInviteLink = async (workspaceId, role) => {
    const res = await API.post(
      `/workspaces/${workspaceId}/invite-link`, {
        role,
      }
    );

    return res.data;
};

export const validateInvite = async (token) => {
  const response = await API.get(`/workspaces/${token}`);
  return response.data;
};

export const joinWorkspace = async (token) => {
  const response = await API.post(`/workspaces/${token}/join`);
  return response.data;
};