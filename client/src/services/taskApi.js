import API from "./api";

const getTasksByProject = async ( projectId ) => {
  const response = await API.get(`/tasks/projects/${projectId}`);
  return response.data;
}

const updateTask = async ( taskId, taskData ) => {
  const response = await API.patch(`/tasks/${taskId}`,
    taskData,
  );
  return response.data.task ?? response.data;
}

const deleteTask = async ( taskId ) => {
  try {
    const response = await API.delete(`/tasks/${taskId}`);
    return response.data;
  } catch (error) {
  console.error(error.response?.data);
  }
}

const moveTask = async (taskId, columnId) => {
  const response = await API.patch(
    `/tasks/${taskId}/move`,
    { columnId }
  );

  return response.data;
}

const createTask = async (taskData) => {
  const response = await API.post("/tasks",
    taskData
  );
  return response.data.task ?? response.data;
}

const archiveTask = async (taskId) => {
  const response = await API.patch(`/tasks/${taskId}/archive`);
  return response.data;
}
const unArchiveTask = async (taskId) => {
  const response = await API.patch(`/tasks/${taskId}/unarchive`);
  return response.data;
}
const getArchivedTasksByProject = async (projectId) => {
  const response = await API.get(`/tasks/project/${projectId}/archived`);
  return response.data;
}

export { getTasksByProject, moveTask, updateTask, deleteTask, createTask, archiveTask, unArchiveTask, getArchivedTasksByProject };