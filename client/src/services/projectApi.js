import API from "./api";

const getProjects = async (workspaceId) => {
    const response = await API.get(`/projects/workspace/${workspaceId}`);
    return response.data;
}

const createProject = async (projectData) => {
    const response = await API.post("/projects", projectData);
    return response.data;
}

const inviteProjectMember = async (projectId, userId) => {
    const response = await API.post(`/projects/${projectId}/members`, { userId });
    return response.data;
}

const removeProjectMember = async (projectId, userId) => {
    const response = await API.delete(`/projects/${projectId}/members/${userId}`);
    return response.data;
}

const updateProject = async (projectId, projectData) => {
    const response = await API.put(`/projects/${projectId}`, projectData);
    return response.data;
}

const copyProject = async (projectId) => {
    const response = await API.post(`/projects/${projectId}/copy`);
    return response.data;
}

const deleteProject = async (projectId) => {
    const response = await API.delete(`/projects/${projectId}`);
    return response.data;
}

export {
    getProjects,
    createProject,
    inviteProjectMember,
    removeProjectMember,
    updateProject,
    copyProject,
    deleteProject
}