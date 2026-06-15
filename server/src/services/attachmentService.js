const Attachment = require ("../models/Attachment");
const Task =  require("../models/Task");

const createAttachment = async ({ taskId, fileData, user }) => {
    const task = await Task.findById(taskId);

    if (!task) {
        throw new Error("Task not found");
    }

    const attachment = await Attachment.create({
        task: taskId,
        fileName: fileData.fileName,
        fileUrl: fileData.fileUrl,
        size: fileData.size,
        uploadedBy: user._id,
    });

    return attachment;
};

const getAttachments = async (taskId) => {
    const attachments = await Attachment.find({
        task: taskId,
    })
    .populate("uploadedBy", "username email")
    .sort({ createdAt: -1 });

    return attachments;
};

const deleteAttachment = async (attachmentId) => {
    const attachment = await Attachment.findById(attachmentId);
    if (!attachment) {
        throw new Error("Attachment not found");
    }
    await attachment.deleteOne();

    return true;
}

module.exports = {
    createAttachment,
    getAttachments,
    deleteAttachment,
}