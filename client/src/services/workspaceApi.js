import API from "./api";

const getWorkspaces = async () => {
    const response = await API.get('/workspaces');
    const data = response.data
    return data;
}

const createWorkspace = async (workspaceData) => {
    const response = await API.post('/workspaces', workspaceData);
    return response.data;
}

const getTags = async (workspaceId) => {
    const response = await API.get(`/workspaces/${workspaceId}/tags`);
    return response.data;
}

const createTag = async (workspaceId, tagName) => {
    const response = await  API.post(`/workspaces/${workspaceId}/tags`,{
        tagName,
    });
    return response.data;
}

const getWorkspaceMembers = async (workspaceId) => {
    const response = await API.get(`/workspaces/${workspaceId}/members`);
    return response.data;
}

const getAvailableMembers = async (workspaceId) => {
    const response = await API.get(`/workspaces/${workspaceId}/availableMembers`);
    return response.data;
}

const invitesMember = async (workspaceId, userId) => {
    const response = await API.post(`/workspaces/${workspaceId}/invite`, userId);
    return response.data;
}

const updateRoleMember = async (workspaceId, memberId, newRole) => {
    const response = await API.patch(`workspaces/${workspaceId}/members/${memberId}/role`, 
        {role: newRole}
    );
    return response.data;
}


export{
    getWorkspaces,
    createWorkspace,
    getTags,
    createTag,
    getWorkspaceMembers,
    getAvailableMembers,
    invitesMember,
    updateRoleMember,
};