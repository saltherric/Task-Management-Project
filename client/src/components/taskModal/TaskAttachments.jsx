import React, { useEffect, useState } from 'react';
import { getAttachment, createAttachment, deleteAttachment, downloadAttachment } from '../../services/attachmentApi';
import { useSocket } from '../../contexts/SocketContext';
import { useAlert } from '../../contexts/AlertContext';

export default function TaskAttachments({ taskId, updateField }) {
  const [attachments, setAttachments] = useState([]);
  const [selectedPreviewImage, setSelectedPreviewImage] = useState(null);
  const [uploading, setUploading] = useState(false);
  const { socket, isConnected } = useSocket();
  const { showAlert } = useAlert();

  useEffect(() => {
    if (taskId) {
      fetchAttachments();
    }
  }, [taskId]);

  useEffect(() => {
    if (!socket || !isConnected || !taskId) return;

    const handleAttachmentCreated = (payload) => {
      if (payload?.taskId !== taskId || !payload.attachment) return;

      setAttachments((prev) => {
        if (prev.some((attachment) => attachment._id === payload.attachment._id)) {
          return prev;
        }

        const next = [payload.attachment, ...prev];
        updateField("attachmentCount", next.length);
        return next;
      });
    };

    const handleAttachmentDeleted = (payload) => {
      if (payload?.taskId !== taskId || !payload.attachmentId) return;

      setAttachments((prev) => {
        const next = prev.filter((item) => item._id !== payload.attachmentId);
        updateField("attachmentCount", next.length);
        return next;
      });
    };

    socket.on("attachment:created", handleAttachmentCreated);
    socket.on("attachment:deleted", handleAttachmentDeleted);

    return () => {
      socket.off("attachment:created", handleAttachmentCreated);
      socket.off("attachment:deleted", handleAttachmentDeleted);
    };
  }, [socket, isConnected, taskId, updateField]);

  const fetchAttachments = async () => {
    try {
      const data = await getAttachment(taskId);
      const attachmentList = data.attachments || [];

      setAttachments(attachmentList);

    } catch (error) {
      console.error(error);
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 B';

    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));

    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
  };

  const handleUploadAttachment = async (selectedFile) => {
    if (!selectedFile) {
      showAlert("Please select a file first", "error");
      return;
    }

    try {
      setUploading(true);

      const formData = new FormData();
      formData.append("file", selectedFile);

      await createAttachment(taskId, formData);

      showAlert("File uploaded successfully", "success");

      document.getElementById("fileUpload").value = "";
    } catch (error) {
      console.error(error);
      showAlert("Upload failed", "error");
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = async (attachmentId, fileName) => {
    try {
      const data = await downloadAttachment(attachmentId);

      const url = data.url;
      const link = document.createElement("a");
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error("Download failed", error);
      showAlert("Download failed", "error");
    }
  };

  const handleDelete = async (attachmentId) => {
    try {
      const data = await deleteAttachment(attachmentId);
      setAttachments((prev) =>
        prev.filter((item) => item._id !== attachmentId)
      );

      updateField("attachmentCount", attachments.length - 1);
      showAlert("Attachment deleted successfully", "success");
    } catch (error) {
      console.error(error);
      showAlert(error.response?.data?.message || "Failed to delete attachment", "error");
    }
  };

  return (
    <div className="space-y-4">
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-neutral-400 uppercase tracking-wider">
          <i className="fa-solid fa-paperclip text-slate-450 dark:text-neutral-500 text-xs"></i>
          <span>Attachments ({attachments.length})</span>
        </div>

        <input
          type="file"
          hidden
          id="fileUpload"
          onChange={(e) => {
            const selectedFile = e.target.files?.[0];

            if (selectedFile) {
              handleUploadAttachment(selectedFile);
            }
          }}
        />

        <label
          htmlFor="fileUpload"
          className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200/80 dark:bg-[#17191E] dark:hover:bg-[#23262D] border border-slate-250 dark:border-[#2D313A] px-3 py-1.5 rounded-xl text-xs font-semibold text-indigo-650 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 transition-all cursor-pointer"
        >
          <i className="fa-solid fa-plus text-xs"></i>
          <span>
            {uploading ? 'Uploading...' : 'Upload attachment'}
          </span>
        </label>
      </div>

      {/* EMPTY STATE */}
      {attachments.length === 0 ? (
        <div className="bg-slate-50 dark:bg-[#111215] border border-dashed border-slate-250 dark:border-[#222429] rounded-2xl p-6 text-center text-xs text-slate-500 dark:text-neutral-505">
          No attachments uploaded yet. Drag & drop or upload files to share
          schemas and designs.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {attachments.map((attachment) => {
            const isImage = /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(
              attachment.fileName || ''
            );

            return (
              <div
                key={attachment._id}
                className="bg-slate-50 dark:bg-[#14161B] border border-slate-250 dark:border-[#22242A] rounded-xl p-3.5 flex items-center justify-between gap-3 group hover:border-slate-350 dark:hover:border-[#353945] transition-all hover:shadow-lg"
              >
                <div className="flex items-center gap-3 min-w-0">
                  {isImage ? (
                    <div className="w-15 h-9 rounded-lg bg-indigo-500/10 border border-indigo-500/20 overflow-hidden">
                      <img
                        src={attachment.fileUrl}
                        alt={attachment.fileName}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="w-10 h-10 rounded-lg bg-slate-250 dark:bg-[#22252F] border border-slate-300 dark:border-neutral-700/50 flex items-center justify-center font-bold text-xs text-indigo-650 dark:text-indigo-400">
                      {attachment.fileName
                        ?.split('.')
                        .pop()
                        ?.toUpperCase()}
                    </div>
                  )}

                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-800 dark:text-neutral-200 truncate">
                      {attachment.fileName}
                    </p>

                    <p className="text-[10px] text-slate-450 dark:text-neutral-500">
                      {formatFileSize(attachment.size)} •{' '}
                      {new Date(
                        attachment.createdAt
                      ).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                {/* ACTIONS */}
                <div className="flex items-center gap-1">
                  {isImage && (
                    <button
                      onClick={() => {
                        if (attachment.fileUrl) {
                          setSelectedPreviewImage(attachment.fileUrl);
                        }
                      }
                      }
                      className="p-1.5 hover:bg-slate-200 dark:hover:bg-[#232733] rounded text-slate-500 dark:text-neutral-400 hover:text-slate-800 dark:hover:text-neutral-200 transition-colors"
                      title="Preview"
                    >
                      <i className="fa-regular fa-eye text-xs"></i>
                    </button>
                  )}

                  <button
                    onClick={() =>
                      handleDownload(attachment._id)
                    }
                    className="p-1.5 hover:bg-slate-200 dark:hover:bg-[#232733] rounded text-slate-500 dark:text-neutral-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
                    title="Download"
                  >
                    <i className="fa-solid fa-download text-xs"></i>
                  </button>

                  <button
                    onClick={() =>
                      handleDelete(attachment._id)
                    }
                    className="p-1.5 hover:bg-rose-500/10 rounded text-slate-450 dark:text-neutral-500 hover:text-rose-600 dark:hover:text-rose-400 transition-colors"
                    title="Delete"
                  >
                    <i className="fa-solid fa-trash-can text-xs"></i>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* IMAGE PREVIEW MODAL */}
      {selectedPreviewImage && (
        <div
          className="fixed inset-0 bg-black/15 backdrop-blur-[2px] flex items-center justify-center z-50"
          onClick={() => setSelectedPreviewImage(null)}
        >
          <img
            src={selectedPreviewImage}
            alt="preview"
            className="max-w-4xl max-h-[90vh] rounded-lg"
            onClick={(e) => e.stopPropagation()}
            onError={(e) => {
              e.target.src = "";
              showAlert("Image failed to load", "error");
              setSelectedPreviewImage(null);
            }}
          />
        </div>
      )}
    </div>
  );
}