import API from "./api";

const getAttachment = async (taskId) => {
    const response = await API.get(`/attachments/tasks/${taskId}/attachments`);
    return response.data;
}

export default getAttachment;