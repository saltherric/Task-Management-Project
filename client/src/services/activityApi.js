import API from "./api";

/**
 * Fetches activity logs for a specific workspace.
 * @param {string} workspaceId - The ID of the workspace.
 * @param {object} params - Optional parameters like project, limit, page.
 */
const getActivities = async (workspaceId, params = {}) => {
  const response = await API.get(`/activities/workspace/${workspaceId}`, { params });
  return response.data;
};

export {
  getActivities,
};
