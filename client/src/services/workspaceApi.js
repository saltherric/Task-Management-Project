import API from "./api";

const getWorkspaces = async () => {
    const response = await API.get('/workspaces');
    const data = response.data
    return data;
}

export default getWorkspaces;