import API from "./api";

const getAttachment = async (taskId) => {
    const response = await API.get(`/attachments/tasks/${taskId}/attachments`);
    return response.data;
}

const createAttachment = async (taskId, formData) => {
    const response = await API.post(`/attachments/tasks/${taskId}/attachments`,
        formData,
        {
            headers: {
                "Content-Type": "multipart/form-data",
            },
        }
    );
    return response.data;
}

const deleteAttachment = async (attachmentId) => {
    const response = await API.delete(`/attachments/${attachmentId}`);
    return response.data;
}

const downloadAttachment = async (attachmentId) => {
    const response = await API.get(`/attachments/download/${attachmentId}`);
    return response.data;
}
export {getAttachment, createAttachment, deleteAttachment, downloadAttachment};