import React, { useEffect, useState } from "react";
import {getComments, createComment} from "../../services/commentApi";
import { getStoredUserInfo } from "../../helpers/auth";
import { useSocket } from "../../contexts/SocketContext";
import { useAlert } from "../../contexts/AlertContext";
import { getAvailableAssignees } from "../../services/assignedToApi";

export default function TaskComments({ taskId, updateField }) {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [isPostingComment, setIsPostingComment] = useState(false);
  const currentUser = getStoredUserInfo();
  const { socket, isConnected } = useSocket();
  const { showAlert } = useAlert();

  const [availableUsers, setAvailableUsers] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestionFilter, setSuggestionFilter] = useState("");
  const [cursorPosition, setCursorPosition] = useState(0);

  useEffect(() => {
    if (!taskId) return;

    const fetchComments = async () => {
      try {
        setLoading(true);

        const data = await getComments(taskId);

        setComments(data.comments || []);
      } catch (error) {
        console.error(error);
        showAlert("Failed to load comments.", "error");
      } finally {
        setLoading(false);
      }
    };

    fetchComments();
  }, [taskId]);

  useEffect(() => {
    if (!taskId) return;

    const fetchAvailableUsers = async () => {
      try {
        const data = await getAvailableAssignees(taskId);
        setAvailableUsers(data.assignees || []);
      } catch (error) {
        console.error("Failed to fetch available assignees for mentions: ", error);
      }
    };

    fetchAvailableUsers();
  }, [taskId]);

  useEffect(() => {
    if (!socket || !isConnected || !taskId) return;

    const handleCommentCreated = (payload) => {
      if (payload?.taskId !== taskId || !payload.comment) return;

      setComments((prev) => {
        if (prev.some((comment) => comment._id === payload.comment._id)) {
          return prev;
        }

        const next = [payload.comment, ...prev];
        updateField("commentCount", next.length);
        return next;
      });
    };

    socket.on("comment:created", handleCommentCreated);

    return () => {
      socket.off("comment:created", handleCommentCreated);
    };
  }, [socket, isConnected, taskId, updateField]);

  const handleAddComment = async (e) => {
    e.preventDefault();

    const content = commentText.trim();

    if (!content || isPostingComment) return;

    try {
      setIsPostingComment(true);

      await createComment(taskId, { content });

      setCommentText("");
    } catch (error) {
      console.error(error);
      showAlert(error.response?.data?.message || "Failed to post comment.", "error");
    } finally {
      setIsPostingComment(false);
    }
  };

  const handleTextareaChange = (e) => {
    const val = e.target.value;
    setCommentText(val);
    const pos = e.target.selectionStart;
    setCursorPosition(pos);

    const textBeforeCursor = val.slice(0, pos);
    const lastAtIdx = textBeforeCursor.lastIndexOf("@");

    if (lastAtIdx !== -1) {
      const query = textBeforeCursor.slice(lastAtIdx + 1);
      const isValidQuery = /^[a-zA-Z0-9_-]*$/.test(query);
      const charBeforeAt = lastAtIdx > 0 ? textBeforeCursor[lastAtIdx - 1] : "";
      const isWordStart = lastAtIdx === 0 || /\s/.test(charBeforeAt);

      if (isValidQuery && isWordStart) {
        setShowSuggestions(true);
        setSuggestionFilter(query);
        return;
      }
    }
    setShowSuggestions(false);
  };

  const insertMention = (user) => {
    const val = commentText;
    const pos = cursorPosition;
    const textBeforeCursor = val.slice(0, pos);
    const lastAtIdx = textBeforeCursor.lastIndexOf("@");
    
    if (lastAtIdx !== -1) {
      const textAfterCursor = val.slice(pos);
      const before = val.slice(0, lastAtIdx);
      const mention = `@${user.username} `;
      const newText = before + mention + textAfterCursor;
      setCommentText(newText);
      setShowSuggestions(false);
      
      setTimeout(() => {
        const textarea = document.getElementById("comment-textarea");
        if (textarea) {
          textarea.focus();
          const newPos = lastAtIdx + mention.length;
          textarea.setSelectionRange(newPos, newPos);
        }
      }, 0);
    }
    setShowSuggestions(false);
  };

  const filteredUsers = availableUsers.filter((u) =>
    u.username?.toLowerCase().includes(suggestionFilter.toLowerCase())
  );

  const renderCommentContent = (content) => {
    if (!content) return "";
    const parts = content.split(/(\B@[a-zA-Z0-9_-]+\b)/g);
    return parts.map((part, i) => {
      if (part.startsWith("@")) {
        return (
          <span key={i} className="text-indigo-650 dark:text-indigo-300 font-semibold bg-indigo-500/10 dark:bg-indigo-500/20 px-1.5 py-0.5 rounded">
            {part}
          </span>
        );
      }
      return part;
    });
  };

  return (
    <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-[#1C1D22]">
      <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-neutral-400 uppercase tracking-wider">
        <i className="fa-regular fa-comment-dots text-slate-450 dark:text-neutral-500 text-xs"></i>
        <span>Comments & Discussion ({comments.length})</span>
      </div>

      <div className="notif-scroll space-y-3 max-h-[350px] overflow-y-auto pr-1">
        {loading ? (
          <p className="text-xs text-slate-500 dark:text-neutral-500">
            Loading comments...
          </p>
        ) : comments.length === 0 ? (
          <p className="text-xs text-slate-500 dark:text-neutral-500">
            No comments yet.
          </p>
        ) : (
          comments.map((comment) => (
            <div
              key={comment._id}
              className="bg-slate-50 dark:bg-[#111215] border border-slate-200 dark:border-[#1C1F26] rounded-2xl p-4 space-y-2"
            >
              <div className="flex items-center gap-2.5">
                {comment.user?.avatar ? (
                  <img
                    src={comment.user.avatar}
                    alt=""
                    className="w-6 h-6 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-indigo-500 text-white font-bold text-[10px] flex items-center justify-center border border-slate-200 dark:border-[#22242B]">
                    {comment.user?.username?.charAt(0).toUpperCase() || 'U'}
                  </div>
                )}

                <span className="text-xs font-bold text-slate-800 dark:text-neutral-200">
                  {comment.user?.username}
                </span>

                <span className="text-[10px] text-slate-450 dark:text-neutral-500">
                  {new Date(
                    comment.createdAt
                  ).toLocaleString()}
                </span>
              </div>

              <p className="text-xs text-slate-700 dark:text-neutral-300 leading-relaxed pl-8">
                {renderCommentContent(comment.content)}
              </p>
            </div>
          ))
        )}
      </div>
      <form
        onSubmit={handleAddComment}
        className="mt-4 bg-slate-50 dark:bg-[#111215] border border-slate-200 dark:border-[#21242E] rounded-2xl p-3 relative"
      >
        <div className="relative">
          {showSuggestions && filteredUsers.length > 0 && (
            <div className="absolute bottom-full left-0 mb-2 w-48 bg-white dark:bg-[#181B24] border border-slate-200 dark:border-[#2E3342] rounded-xl p-1.5 shadow-2xl z-40 max-h-48 overflow-y-auto">
              <p className="text-[10px] text-slate-500 dark:text-neutral-500 px-2 py-1 border-b border-slate-100 dark:border-[#242835] mb-1 font-semibold uppercase tracking-wider">Teammates</p>
              {filteredUsers.map((user) => (
                <button
                  key={user._id}
                  type="button"
                  onClick={() => insertMention(user)}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 text-left text-xs text-slate-700 dark:text-neutral-200 hover:bg-slate-100 dark:hover:bg-[#1E212A] rounded-lg transition-colors cursor-pointer"
                >
                  {user.avatar ? (
                    <img src={user.avatar} alt="" className="w-5 h-5 rounded-full object-cover" />
                  ) : (
                    <div className="w-5 h-5 rounded-full bg-indigo-500 text-white font-bold text-[8px] flex items-center justify-center">
                      {user.username?.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <span>{user.username}</span>
                </button>
              ))}
            </div>
          )}
          <textarea
            id="comment-textarea"
            value={commentText}
            onChange={handleTextareaChange}
            onSelect={(e) => setCursorPosition(e.target.selectionStart)}
            placeholder="Post a comment... Use @username to mention a teammate"
            className="w-full bg-transparent text-xs text-slate-800 dark:text-neutral-200 focus:outline-none resize-none min-h-[55px] leading-relaxed"
          />
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-[#1C1F2A] mt-2">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() =>
                setCommentText((prev) => prev + " 👍")
              }
              className="p-1 hover:bg-slate-200 dark:hover:bg-[#1C2029] rounded text-slate-450 dark:text-neutral-400 hover:text-amber-500 dark:hover:text-amber-400 transition-colors"
              title="Add reaction"
            >
              👍
            </button>

            <button
              type="button"
              onClick={() =>
                setCommentText((prev) => prev + " 🔥")
              }
              className="p-1 hover:bg-slate-200 dark:hover:bg-[#1C2029] rounded text-slate-450 dark:text-neutral-400 hover:text-red-500 dark:hover:text-red-400 transition-colors"
              title="Add reaction"
            >
              🔥
            </button>

            <button
              type="button"
              onClick={() => {
                const textarea = document.getElementById("comment-textarea");
                const pos = textarea ? textarea.selectionStart : commentText.length;
                const val = commentText;
                const newText = val.slice(0, pos) + "@" + val.slice(pos);
                setCommentText(newText);
                setCursorPosition(pos + 1);
                setShowSuggestions(true);
                setSuggestionFilter("");
                setTimeout(() => {
                  if (textarea) {
                    textarea.focus();
                    textarea.setSelectionRange(pos + 1, pos + 1);
                  }
                }, 0);
              }}
              className="p-1 hover:bg-slate-200 dark:hover:bg-[#1C2029] rounded text-slate-450 dark:text-neutral-400 hover:text-indigo-650 dark:hover:text-indigo-400 transition-colors flex items-center justify-center"
              title="Mention user"
            >
              <svg className="w-3.5 h-3.5 text-slate-500 hover:text-indigo-600 dark:text-neutral-400 dark:hover:text-indigo-400" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0Zm0 0c0 1.657 1.007 3 2.25 3S21 13.657 21 12a9 9 0 1 0-2.636 6.364M16.5 12V8.25" />
              </svg>
            </button>
          </div>

          <button
            type="submit"
            disabled={
              !commentText.trim() || isPostingComment
            }
            className="
              bg-indigo-600
              hover:bg-indigo-500
              disabled:opacity-40
              disabled:cursor-not-allowed
              text-white
              text-xs
              font-semibold
              px-4
              py-1.5
              rounded-xl
              shadow-lg
              transition-all
            "
          >
            {isPostingComment
              ? "Posting..."
              : "Post Comment"}
          </button>
        </div>
      </form>
    </div>
  );
}

// import React from 'react'

// export default function TaskComments({
//   taskId
// }) {
//   return (
//     <div className="space-y-4 pt-4 border-t border-[#1C1D22]">
//       <div className="flex items-center gap-2 text-xs font-semibold text-neutral-400 uppercase tracking-wider">
//         <Icons.MessageSquare className="text-neutral-500 w-4 h-4" />
//         <span>Comments & Discussion ({comments.length})</span>
//       </div>

//       <div className="space-y-4 max-h-[300px] overflow-y-auto pr-1">
//         {comments.map((comment) => (
//           <div key={comment.id} className="bg-[#111215] border border-[#1C1F26] rounded-2xl p-4 space-y-2 relative group hover:border-[#2D323E] transition-all">
//             <div className="flex items-center justify-between">
//               <div className="flex items-center gap-2.5">
//                 <img src={comment.user.avatar} alt="avatar" className="w-6 h-6 rounded-full object-cover" />
//                 <span className="text-xs font-bold text-neutral-200">{comment.user.name}</span>
//                 <span className="text-[10px] text-neutral-500">{comment.timestamp}</span>
//               </div>

//               {/* Inline actions */}
//               <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
//                 <button 
//                   onClick={() => {
//                     setEditingCommentId(comment.id);
//                     setEditCommentText(comment.content);
//                   }}
//                   className="text-[10px] bg-[#1E212A] hover:bg-indigo-600/20 text-neutral-400 hover:text-indigo-400 px-2 py-1 rounded transition-all"
//                 >
//                   Edit
//                 </button>
//                 <button 
//                   onClick={() => handleDeleteComment(comment.id)}
//                   className="text-[10px] bg-[#1E212A] hover:bg-rose-600/20 text-neutral-400 hover:text-rose-400 px-2 py-1 rounded transition-all"
//                 >
//                   Delete
//                 </button>
//               </div>
//             </div>

//             {editingCommentId === comment.id ? (
//               <div className="space-y-2 mt-2">
//                 <textarea
//                   value={editCommentText}
//                   onChange={(e) => setEditCommentText(e.target.value)}
//                   className="w-full bg-[#1A1C23] border border-indigo-500/40 rounded-xl p-2.5 text-xs text-neutral-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
//                 />
//                 <div className="flex justify-end gap-1.5">
//                   <button 
//                     onClick={() => handleSaveEditComment(comment.id)}
//                     className="bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-semibold px-3 py-1 rounded-lg"
//                   >
//                     Save
//                   </button>
//                   <button 
//                     onClick={() => setEditingCommentId(null)}
//                     className="bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-[10px] font-semibold px-3 py-1 rounded-lg"
//                   >
//                     Cancel
//                   </button>
//                 </div>
//               </div>
//             ) : (
//               <p className="text-xs text-neutral-300 leading-relaxed pl-8">
//                 {comment.content.split(' ').map((word, i) => {
//                   if (word.startsWith('@')) {
//                     return <span key={i} className="text-indigo-400 font-semibold bg-indigo-500/10 px-1 py-0.5 rounded mr-1">{word}</span>;
//                   }
//                   return word + ' ';
//                 })}
//               </p>
//             )}
//           </div>
//         ))}
//       </div>

//       {/* STICKY NEW COMMENT COMPONENT WITH QUICK AT-MENTIONS */}
//       <form onSubmit={handleAddComment} className="mt-4 bg-[#111215] border border-[#21242E] rounded-2xl p-3 relative">
//         <div className="relative">
//           <textarea
//             value={commentText}
//             onChange={handleCommentChange}
//             placeholder="Post a comment... Use @username to mention a teammate"
//             className="w-full bg-transparent text-xs text-neutral-200 focus:outline-none resize-none min-h-[55px] pr-12 leading-relaxed"
//           />

//           {/* Mentions dropdown simulation */}
//           {showMentionSuggestions && (
//             <div className="absolute bottom-full left-0 mb-2 w-48 bg-[#181B24] border border-[#2E3342] rounded-xl p-1 shadow-2xl z-40">
//               <p className="text-[10px] text-neutral-500 px-2 py-1 border-b border-[#242835]">Teammates</p>
//               {ALL_AVAILABLE_USERS.filter(u => u.name.toLowerCase().includes(mentionQuery)).map(user => (
//                 <button
//                   key={user._id}
//                   type="button"
//                   onClick={() => insertMention(user)}
//                   className="w-full flex items-center gap-2 px-2.5 py-1.5 text-left text-xs text-neutral-200 hover:bg-indigo-600/15 rounded-lg transition-colors"
//                 >
//                   <img src={user.avatar} alt="" className="w-4.5 h-4.5 rounded-full object-cover" />
//                   <span>{user.name}</span>
//                 </button>
//               ))}
//             </div>
//           )}
//         </div>

//         <div className="flex items-center justify-between pt-2 border-t border-[#1C1F2A] mt-2">
//           <div className="flex items-center gap-1.5">
//             <button 
//               type="button" 
//               onClick={() => setCommentText(prev => prev + " 👍")}
//               className="p-1 hover:bg-[#1C2029] rounded text-neutral-400 hover:text-amber-400 transition-colors"
//               title="Reaction"
//             >
//               👍
//             </button>
//             <button 
//               type="button" 
//               onClick={() => setCommentText(prev => prev + " 🔥")}
//               className="p-1 hover:bg-[#1C2029] rounded text-neutral-400 hover:text-red-400 transition-colors"
//               title="Reaction"
//             >
//               🔥
//             </button>
//             <button 
//               type="button" 
//               onClick={() => {
//                 setShowMentionSuggestions(true);
//                 setCommentText(prev => prev + "@");
//               }}
//               className="p-1.5 hover:bg-[#1C2029] rounded text-neutral-400 hover:text-indigo-400 transition-colors"
//               title="Mention user"
//             >
//               <Icons.AtSign className="w-3.5 h-3.5" />
//             </button>
//           </div>

//           <button
//             type="submit"
//             disabled={!commentText.trim()}
//             className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:hover:bg-indigo-600 text-white text-xs font-semibold px-4 py-1.5 rounded-xl shadow-lg transition-all"
//           >
//             Post Comment
//           </button>
//         </div>
//       </form>
//     </div>
//   );
// }

// // Keep API logic inside this component.1   