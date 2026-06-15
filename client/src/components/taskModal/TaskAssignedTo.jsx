import React, { useEffect, useState } from 'react';
import { CheckCircle, Plus, UserPlus } from 'lucide-react';
import { getAvailableAssignees, assignUser, removeAssign } from '../../services/assignedToApi';

export default function TaskAssignedTo({ task, onTaskUpdate }) {
  const [workspaceMembers, setWorkspaceMembers] = useState([]);
  const [activeDropdown, setActiveDropdown] = useState(null);

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
        assignedTo.some(
          (u) =>
            u._id === selectedUser._id
        );

      let response;

      if (isAssigned) {
        response =
          await removeAssign(
            task._id,
            selectedUser._id
          );
      } else {
        response =
          await assignUser(
            task._id,
            selectedUser._id
          );
      }

      onTaskUpdate(response.task);

      setActiveDropdown(null);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="space-y-2">
        <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider font-mono">Assignees</span>
            
            {/* Plus button trigger dropdown */}
            <div className="relative">
            <button 
                onClick={() => setActiveDropdown(activeDropdown === 'assignee' ? null : 'assignee')}
                className="text-neutral-500 hover:text-indigo-400 transition-colors"
                title="Manage Assignees"
            >
                <UserPlus className="w-4 h-4" />
            </button>

            {activeDropdown === 'assignee' && (
                <div className="absolute right-0 mt-2 w-48 bg-[#14161C] border border-[#272B35] shadow-2xl rounded-2xl p-1.5 z-30">
                <p className="text-[10px] text-neutral-500 px-2 py-1 border-b border-[#242835] mb-1">Select Assignees</p>
                {workspaceMembers.map((user) => {
                    const isAssigned = (task.assignedTo || []).some(u => u._id === user._id);
                    return (
                    <button
                        key={user._id}
                        onClick={() => toggleAssignee(user)}
                        className={`w-full flex items-center justify-between px-2 py-1.5 rounded-xl text-xs hover:bg-[#1E212A] text-left transition-colors ${isAssigned ? 'bg-indigo-500/10 text-indigo-300' : 'text-neutral-300'}`}
                    >
                        <div className="flex items-center gap-2">
                        <img src={user.avatar} alt="" className="w-5 h-5 rounded-full object-cover" />
                        <span>{user.username}</span>
                        </div>
                        {isAssigned && <CheckCircle className="w-3.5 h-3.5 text-indigo-400" />}
                    </button>
                    );
                })}
                </div>
            )}
            </div>
        </div>

        <div className="space-y-1.5">
            {(task.assignedTo || []).map((user) => (
            <div 
                key={user._id} 
                className="flex items-center justify-between bg-[#111215] border border-[#1C1F26] p-2 rounded-xl group hover:border-indigo-500/30 transition-all"
            >
                <div className="flex items-center gap-2">
                <img src={user.avatar} alt="avatar" className="w-6 h-6 rounded-full object-cover border border-[#22242B]" />
                <span className="text-xs font-semibold text-neutral-200">{user.username}</span>
                </div>
                
                <button 
                onClick={() => toggleAssignee(user)}
                className="text-[10px] text-neutral-500 hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-opacity"
                title="Remove Assignee"
                >
                Remove
                </button>
            </div>
            ))}

            <button 
            onClick={() => setActiveDropdown('assignee')}
            className="w-full flex items-center justify-center gap-1.5 py-2 px-3 border border-dashed border-[#22242B] rounded-xl hover:border-indigo-500/40 text-[11px] text-neutral-400 hover:text-indigo-400 transition-all"
            >
            <Plus className="w-3 h-3" />
            <span>Add Assignee</span>
            </button>
        </div>
    </div>
  )
}
