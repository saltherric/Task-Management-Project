import API from "./api";

const getColumns = async (projectId) => {
    const response = await  API.get(`/columns/project/${projectId}`);
    return response.data;
}

export default getColumns;