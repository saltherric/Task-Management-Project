const { createAttachment: createAttachmentService, getAttachments: getAttachmentsService, deleteAttachment: deleteAttachmentService } = require("../services/attachmentService");
const {uploadFile} = require("../services/uploadFile");
const {generateSignedUrl, generateSignedDownloadUrl } = require("../services/signedUrl");
const Attachment = require("../models/Attachment");
const Task = require("../models/Task");
const Project = require("../models/Project");
const { emitToWorkspace } = require("../socket/socketGateway");

const resolveWorkspaceFromTask = async (taskId) => {
  const task = await Task.findById(taskId).select("project");
  if (!task?.project) {
    return { workspaceId: null, projectId: null };
  }

  const project = await Project.findById(task.project).select("workspace");
  return {
    projectId: task.project.toString(),
    workspaceId: project?.workspace?.toString() || null,
  };
};

const createAttachment = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "File is required",
      });
    }

    const { fileKey } = await uploadFile(req.file);

    const attachment = await createAttachmentService({
      taskId: req.params.taskId,
      fileData: {
        fileName: req.file.originalname,
        fileKey,
        size: req.file.size,
      },
      user: req.user,
    });

    const fileUrl = await generateSignedUrl(fileKey);

    const payloadAttachment = {
      ...attachment.toObject(),
      fileUrl,
    };

    const { workspaceId, projectId } = await resolveWorkspaceFromTask(req.params.taskId);
    if (workspaceId) {
      emitToWorkspace(workspaceId, "attachment:created", {
        attachment: payloadAttachment,
        taskId: req.params.taskId,
        projectId,
        actorId: req.user?._id?.toString(),
      });
    }

    res.status(201).json({
      success: true,
      attachment: payloadAttachment,
    });
  } catch (error) {
    next(error);
  }
};

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
        const result = await deleteAttachmentService(req.params.attachmentId);

        if (result?.projectId) {
          const project = await Project.findById(result.projectId).select("workspace");
          const workspaceId = project?.workspace?.toString();

          if (workspaceId) {
            emitToWorkspace(workspaceId, "attachment:deleted", {
              attachmentId: result.attachmentId,
              taskId: result.taskId,
              projectId: result.projectId,
              actorId: req.user?._id?.toString(),
            });
          }
        }

        res.status(200).json({
            success: true,
            messagge: "Attachment deleted successfully",
            deletedAttachmentId: req.params.attachmentId,
        });
    } catch (error) {
        next(error);
    }
}

const downloadAttachment = async (req, res, next) => {
    try {
        const attachment = await Attachment.findById(req.params.attachmentId);
        if (!attachment) {
            return res.status(404).json({
                success: false,
                message: "Attachment not found",
            });
        }

        const url = await generateSignedDownloadUrl(
            attachment.fileKey,
            attachment.fileName
        );
        res.json({
            success: true,
            url,
        });
    } catch (error) {
        next(error);
    }
}

module.exports = {
    createAttachment,
    getAttachments,
    deleteAttachment,
    downloadAttachment
}