const { createAttachment: createAttachmentService, getAttachments: getAttachmentsService, deleteAttachment: deleteAttachmentService } = require("../services/attachmentService");

const createAttachment = async (req, res, next) => {
    try {
        const attachment = await createAttachmentService({
            taskId: req.params.taskId,
            fileData: req.body,
            user: req.user,
        })

        res.status(200).json({
            success: true,
            attachment,
        })
    } catch (error) {
        next(error);
    }
}

const getAttachments = async (req, res, next) => {
    try {
        const attachments = await getAttachmentsService(req.params.taskId)

        res.status(200).json({
            success: true,
            attachments,
        })
    } catch (error) {
        next(error);
    }
}

const deleteAttachment = async (req, res, next) => {
    try {
        await deleteAttachmentService(req.params.attachmentId);
        res.status(200).json({
            success: true,
            messagge: "Attachment deleted successfully",
        });
    } catch (error) {
        next(error);
    }
}

module.exports = {
    createAttachment,
    getAttachments,
    deleteAttachment,
}