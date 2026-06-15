import API from "./api";

const getProjects = async (workspaceId) => {
    const response = await API.get(`/projects/workspace/${workspaceId}`);
    return response.data;
}

export default getProjects;