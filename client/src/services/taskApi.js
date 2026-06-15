import API from "./api";

const getTasksByProject = async ( projectId ) => {
  const response = await API.get(`/tasks/projects/${projectId}`);
  return response.data;
}

const updateTask = async ( taskId, taskData ) => {
  const response = await API.patch(`/tasks/${taskId}`,
    taskData,
  );
  return response.data;
}

const moveTask = async (taskId, columnId) => {
  const response = await API.patch(
    `/tasks/${taskId}/move`,
    { columnId }
  );

  return response.data;
}

export { getTasksByProject, moveTask, updateTask };