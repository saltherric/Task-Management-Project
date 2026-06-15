import API from "./api";

const getComments = async (taskId) => {
    const response = await API.get(`/comments/tasks/${taskId}/comments`);
    return response.data;
}

const createComment = async (taskId, commentData) => {
    const response = await API.post(`/comments/tasks/${taskId}/comments`,
        commentData
    );
    return response.data;
}
export {
    getComments,
    createComment,
}