import React, { useEffect, useState } from 'react';
import { CheckCircle, Plus, UserPlus } from 'lucide-react';
import { getAvailableAssignees, assignUser, removeAssign } from '../../services/assignedToApi';
import { useAlert } from '../../contexts/AlertContext';

export default function TaskAssignedTo({ task, onTaskUpdate, isAdmin }) {
  const [workspaceMembers, setWorkspaceMembers] = useState([]);
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [failedAvatars, setFailedAvatars] = useState({});
  const { showAlert } = useAlert();

  const handleAvatarError = (userId) => {
    setFailedAvatars(prev => ({ ...prev, [userId]: true }));
  };

  const getUserKey = (user, index) =>
    user?._id || user?.id || user?.username || `user-${index}`;

  useEffect(() => {
    if (!task?._id) return;

    const fetchMembers = async () => {
      try {
        const response =
          await getAvailableAssignees(
            task._id
          );

        setWorkspaceMembers(
          response.assignees || []
        );
      } catch (error) {
        console.error(error);
        showAlert("Failed to load workspace members.", "error");
      }
    };

    fetchMembers();
  }, [task?._id]);

  const toggleAssignee = async (
    selectedUser
  ) => {
    try {
      const assignedTo = task.assignedTo || [];
      const isAssigned =
        assignedTo.filter(Boolean).some(
          (u) =>
            u._id === selectedUser._id
        );

      let response;

      if (isAssigned) {
        response = await removeAssign(
          task._id,
          selectedUser._id
        );
        showAlert(`Removed ${selectedUser.username} from task.`, "success");
      } else {
        response =
          await assignUser(
            task._id,
            selectedUser._id
          );
        showAlert(`Assigned ${selectedUser.username} to task.`, "success");
      }

      onTaskUpdate(response.task);

      setActiveDropdown(null);
    } catch (error) {
      console.error(error);
      showAlert(error.response?.data?.message || "Failed to update assignees.", "error");
    }
  };

  return (
    <div className="space-y-2">
        <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-500 dark:text-neutral-500 uppercase tracking-wider font-mono">Assignees</span>
            
            {/* Plus button trigger dropdown */}
            {isAdmin && (
              <div className="relative">
              <button 
                  onClick={() => setActiveDropdown(activeDropdown === 'assignee' ? null : 'assignee')}
                  className="text-slate-500 dark:text-neutral-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                  title="Manage Assignees"
              >
                  <UserPlus className="w-4 h-4" />
              </button>

              {activeDropdown === 'assignee' && (
                  <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-[#14161C] border border-slate-200 dark:border-[#272B35] shadow-2xl rounded-2xl p-1.5 z-30">
                    <p className="text-[10px] text-slate-500 dark:text-neutral-500 px-2 py-1 border-b border-slate-100 dark:border-[#242835] mb-1">Select Assignees</p>
                    {workspaceMembers.filter(Boolean).map((user, index) => {
                        const isAssigned = (task.assignedTo || []).filter(Boolean).some(u => u._id === user._id);
                        return (
                          <button
                            key={getUserKey(user, index)}
                            onClick={() => toggleAssignee(user)}
                            className={`w-full flex items-center justify-between px-2 py-1.5 rounded-xl text-xs hover:bg-slate-100 dark:hover:bg-[#1E212A] text-left transition-colors ${isAssigned ? 'bg-indigo-500/10 text-indigo-650 dark:text-indigo-300' : 'text-slate-700 dark:text-neutral-300'}`}
                          >
                            <div className="flex items-center gap-2">
                            {user.avatar && !failedAvatars[user._id] ? (
                              <img 
                                src={user.avatar} 
                                alt="" 
                                onError={() => handleAvatarError(user._id)}
                                className="w-5 h-5 rounded-full object-cover" 
                              />
                            ) : (
                              <div className="w-5 h-5 rounded-full bg-indigo-500 text-white font-bold text-[9px] flex items-center justify-center">
                                {user.username?.charAt(0).toUpperCase() || 'U'}
                              </div>
                            )}
                            <span>{user.username}</span>
                            </div>
                            {isAssigned && <CheckCircle className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400" />}
                          </button>
                        );
                      })}
                  </div>
              )}
              </div>
            )}
        </div>

        <div className="space-y-1.5">
            {(task.assignedTo || []).filter(Boolean).map((user, index) => (
            <div 
                key={getUserKey(user, index)}
                className="flex items-center justify-between bg-slate-50/50 dark:bg-[#111215]/50 border border-slate-200 dark:border-[#1C1F26]/80 p-2 rounded-xl group hover:border-indigo-500/25 hover:bg-slate-100/30 dark:hover:bg-[#1C1E24]/30 transition-all duration-200"
            >
                <div className="flex items-center gap-2">
                {user.avatar && !failedAvatars[user._id] ? (
                  <img 
                    src={user.avatar} 
                    alt="avatar" 
                    onError={() => handleAvatarError(user._id)}
                    className="w-6 h-6 rounded-full object-cover border border-slate-200 dark:border-[#22242B]" 
                  />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-indigo-500 text-white font-bold text-[10px] flex items-center justify-center border border-slate-200 dark:border-[#22242B]">
                    {user.username?.charAt(0).toUpperCase() || 'U'}
                  </div>
                )}
                <span className="text-xs font-semibold text-slate-800 dark:text-neutral-200">{user.username}</span>
                </div>
                
                {isAdmin && (
                  <button 
                  onClick={() => toggleAssignee(user)}
                  className="text-[10px] text-slate-450 dark:text-neutral-500 hover:text-rose-600 dark:hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                  title="Remove Assignee"
                  >
                  Remove
                  </button>
                )}
            </div>
            ))}

            {isAdmin && (
              <button 
              onClick={() => setActiveDropdown('assignee')}
              className="w-full flex items-center justify-center gap-1.5 py-2 px-3 border border-dashed border-slate-250 dark:border-slate-800/80 rounded-xl hover:border-indigo-500/40 hover:bg-slate-50/60 dark:hover:bg-[#1E2026]/40 text-[11px] text-slate-500 dark:text-neutral-400 hover:text-indigo-650 dark:hover:text-indigo-400 transition-all cursor-pointer"
              >
              <Plus className="w-3 h-3" />
              <span>Add Assignee</span>
              </button>
            )}
        </div>
    </div>
  )
}
