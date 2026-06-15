import React, { useEffect, useState } from 'react';
import getAttachment from '../../services/attachmentApi';
// import * as Icons from 'lucide-react'; // or your icon source
import { toast } from 'react-toastify';

export default function TaskAttachments({ taskId }) {
  const [attachments, setAttachments] = useState([]);
  const [selectedPreviewImage, setSelectedPreviewImage] = useState(null);

  useEffect(() => {
    if (taskId) {
      fetchAttachments();
    }
  }, [taskId]);

  const fetchAttachments = async () => {
    try {
      const data = await getAttachment(taskId);
      setAttachments(data.attachments || []);
    } catch (error) {
      console.error(error);
    }
  };

  const handleUploadAttachment = () => {
    console.log('Upload clicked');
    // later: open modal or file input
  };

  const handleDeleteAttachment = async (id) => {
    try {
      console.log('Delete:', id);
      // call delete API here
      // await deleteAttachment(id);

      setAttachments((prev) => prev.filter((a) => a._id !== id));
      toast.success('Attachment deleted');
    } catch (error) {
      console.error(error);
      toast.error('Delete failed');
    }
  };

  return (
    <div className="space-y-4">
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-semibold text-neutral-400 uppercase tracking-wider">
          {/* <Paperclip className="" /> */}
          <i className="fa-solid fa-paperclip text-neutral-500 text-xs"></i>
          <span>Attachments ({attachments.length})</span>
        </div>

        <button
          onClick={handleUploadAttachment}
          className="flex items-center gap-1.5 bg-[#17191E] hover:bg-[#23262D] border border-[#2D313A] px-3 py-1.5 rounded-xl text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition-all"
        >
          {/* <Plus className="" /> */}
          <i className="fa-solid fa-plus text-xs"></i>
          <span>Upload attachment</span>
        </button>
      </div>

      {/* EMPTY STATE */}
      {attachments.length === 0 ? (
        <div className="bg-[#111215] border border-dashed border-[#222429] rounded-2xl p-6 text-center text-xs text-neutral-500">
          No attachments uploaded yet. Drag & drop or upload files to share schemas and designs.
        </div>
      ) : (
        /* LIST */
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {attachments.map((file) => (
            <div
              key={file._id}
              className="bg-[#14161B] border border-[#22242A] rounded-xl p-3.5 flex items-center justify-between gap-3 group hover:border-[#353945] transition-all hover:shadow-lg"
            >
              <div className="flex items-center gap-3 min-w-0">
                {file.fileUrl ? (
                  <div className="w-10 h-10 rounded-lg bg-indigo-500/10 border border-indigo-500/20 overflow-hidden flex items-center justify-center relative">
                    <img
                      src={file.fileUrl}
                      alt="preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="w-10 h-10 rounded-lg bg-[#22252F] border border-neutral-700/50 flex items-center justify-center font-bold text-xs text-indigo-400">
                    {file.fileName?.split('.').pop()?.toUpperCase()}
                  </div>
                )}

                <div className="min-w-0">
                  <p className="text-xs font-bold text-neutral-200 truncate">
                    {file.fileName}
                  </p>
                  <p className="text-[10px] text-neutral-500">
                    {file.size} bytes •{' '}
                    {new Date(file.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>

              {/* ACTIONS */}
              <div className="flex items-center gap-1">
                {file.fileUrl && (
                  <button
                    onClick={() => setSelectedPreviewImage(file.fileUrl)}
                    className="p-1.5 hover:bg-[#232733] rounded text-neutral-400 hover:text-neutral-200 transition-colors"
                    title="Preview Screen"
                  >
                    {/* <Eye className="" /> */}
                    <i className="fa-regular fa-eye text-xs"></i>
                  </button>
                )}

                <button
                  onClick={() => window.open(file.fileUrl, '_blank')}
                  className="p-1.5 hover:bg-[#232733] rounded text-neutral-400 hover:text-emerald-400 transition-colors"
                  title="Download"
                >
                  {/* <Download className="w-3.5 h-3.5" /> */}
                  <i className="fa-solid fa-download text-xs"></i>
                </button>

                <button
                  onClick={() => handleDeleteAttachment(file._id)}
                  className="p-1.5 hover:bg-rose-500/15 rounded text-neutral-500 hover:text-rose-400 transition-colors"
                  title="Delete File"
                >
                  {/* <Trash className="" /> */}
                  <i className="fa-solid fa-trash-can text-xs"></i>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* OPTIONAL PREVIEW */}
      {selectedPreviewImage && (
        <div
          className="fixed inset-0 bg-black/70 flex items-center justify-center"
          onClick={() => setSelectedPreviewImage(null)}
        >
          <img
            src={selectedPreviewImage}
            alt="preview"
            className="max-w-3xl max-h-[80vh] rounded-lg"
          />
        </div>
      )}
    </div>
  );
}