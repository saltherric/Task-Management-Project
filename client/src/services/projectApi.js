import API from "./api";

const getProjects = async (workspaceId) => {
    const response = await API.get(`/projects/workspace/${workspaceId}`);
    return response.data;
}

const createProject = async (projectData) => {
    const response = await API.post("/projects", projectData);
    return response.data;
}

export {
    getProjects,
    createProject
}