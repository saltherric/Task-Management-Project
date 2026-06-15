import API from "./api";

const getAvailableAssignees = async (taskId) => {
    const response = await API.get(`/tasks/${taskId}/available-assignees`);
    return response.data;
}

const assignUser = async (taskId, userId) => {
    const response = await API.put(`/tasks/${taskId}/assignees`,
        { userId }
    );
    return response.data;
}

const removeAssign = async (taskId, userId) => {
    const response = await API.delete(`/tasks/${taskId}/assignees/${userId}`);
    return response.data;
}

export {
    getAvailableAssignees,
    assignUser,
    removeAssign
}
