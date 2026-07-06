const Attachment = require ("../models/Attachment");
const Task =  require("../models/Task");
const { deleteFile } = require("../services/uploadFile");
const {generateSignedUrl} = require("./signedUrl");

const createAttachment = async ({ taskId, fileData, user }) => {
    const task = await Task.findById(taskId);
    if (!task) {
        throw new Error("Task not found");
    }

    const attachment = await Attachment.create({
        task: taskId,
        fileName: fileData.fileName,
        fileKey: fileData.fileKey,
        fileUrl: fileData.fileUrl,
        size: fileData.size,
        uploadedBy: user._id,
    });

    await Task.findByIdAndUpdate(
        taskId,
        { $inc: { attachmentCount: 1 }}
    )

    return attachment;
};

const getAttachments = async (taskId) => {
    const attachments = await Attachment.find({ task: taskId }).lean();

    return Promise.all(
        attachments.map(async (att) => ({
            ...att,
            fileUrl: await generateSignedUrl(att.fileKey),
        }))
    );
};

const deleteAttachment = async (attachmentId) => {
    const attachment = await Attachment.findById(attachmentId);

    if (!attachment) {
        throw new Error("Attachment not found");
    }

    // delete file from s3 first
    await deleteFile(attachment.fileKey);

    // delete attachment record
    await Attachment.findByIdAndDelete(attachmentId);

    // descrease count
    await Task.findByIdAndUpdate(
        attachment.task,
        { $inc: { attachmentCount: -1 }}
    );

    const task = await Task.findById(attachment.task).select("project");

    return {
        attachmentId,
        taskId: attachment.task?.toString(),
        projectId: task?.project?.toString() || null,
    };
}

module.exports = {
    createAttachment,
    getAttachments,
    deleteAttachment,
}