import { useState, useRef, useEffect, useMemo } from 'react'
import { getWorkspaceMembers } from '../../services/workspaceApi';
import { inviteProjectMember, removeProjectMember } from '../../services/projectApi';
import { getStoredUserInfo } from "../../helpers/auth";
import { UserPlus, X, Search, Trash2, Crown } from 'lucide-react';

export default function InviteTaskModal({ isOpen, project, projectId, workspaceId, onClose, onProjectUpdated }) {
  const [workspaceMembers, setWorkspaceMembers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const searchContainerRef = useRef(null);
  const currentUser = getStoredUserInfo();

  // Load workspace members
  useEffect(() => {
    if (!isOpen || !workspaceId) return;

    const fetchWorkspaceMembers = async () => {
      try {
        const data = await getWorkspaceMembers(workspaceId);
        setWorkspaceMembers(data.members || []);
      } catch (error) {
        console.error("Failed to load workspace members:", error);
      }
    };

    fetchWorkspaceMembers();
  }, [isOpen, workspaceId]);

  // Handle clicking outside suggestions to close them
  useEffect(() => {
    function handleClickOutside(event) {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const projectCreatorId = project?.createdBy?._id || project?.createdBy;
  const isCreator = currentUser?._id === projectCreatorId;

  // Filter workspace members that can be invited (not creator and not already in members)
  const availableMembers = useMemo(() => {
    if (!workspaceMembers || !project) return [];
    const projectMemberIds = new Set([
      projectCreatorId,
      ...(project.members || []).map(m => m.user?._id || m.user)
    ].map(id => id?.toString()));

    return workspaceMembers.filter(member => {
      const memberId = member._id || member.user?._id;
      return !projectMemberIds.has(memberId?.toString());
    });
  }, [workspaceMembers, project, projectCreatorId]);

  // Suggestions filtered by search query
  const filteredSuggestions = useMemo(() => {
    if (!searchQuery.trim()) return [];

    return availableMembers.filter(
      member =>
        member.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        member.email?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery, availableMembers]);

  const displayMembers = useMemo(() => {
    if (!project) return [];
    
    if (project.visibility === 'workspace') {
      // Show all workspace members except the creator
      return workspaceMembers.map(m => m.user || m).filter(m => {
        const mId = m._id || m.id;
        return String(mId) !== String(projectCreatorId);
      });
    } else {
      // Show only explicitly invited project members
      return (project.members || []).map(m => m.user).filter(Boolean);
    }
  }, [project, workspaceMembers, projectCreatorId]);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  };

  const handleInviteMember = async (userId, username) => {
    try {
      setIsLoading(true);
      const data = await inviteProjectMember(projectId, userId);
      if (data.success && data.project) {
        onProjectUpdated(data.project);
        showToast(`Invited ${username} successfully`);
      } else {
        showToast("Failed to invite member");
      }
      setSearchQuery('');
      setShowSuggestions(false);
    } catch (error) {
      console.error(error);
      showToast(error.response?.data?.message || "Failed to invite member.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveMember = async (userId, username) => {
    const confirmed = window.confirm(`Remove ${username} from project?`);
    if (!confirmed) return;

    try {
      setIsLoading(true);
      const data = await removeProjectMember(projectId, userId);
      if (data.success && data.project) {
        onProjectUpdated(data.project);
        showToast(`Removed ${username} from project`);
      } else {
        showToast("Failed to remove member");
      }
    } catch (error) {
      console.error(error);
      showToast(error.response?.data?.message || "Failed to remove member.");
    } finally {
      setIsLoading(false);
    }
  };

  const getInitials = (name = '') => {
    return name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map(word => word[0])
      .join('')
      .toUpperCase() || 'U';
  };

  if (!isOpen || !project) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      
      {toastMessage && (
        <div className="absolute top-6 left-1/2 -translate-x-1/2 bg-slate-900 border border-slate-800 text-xs text-indigo-400 font-semibold px-4.5 py-2.5 rounded-xl shadow-2xl z-[60] flex items-center gap-2 animate-bounce">
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-ping" />
          {toastMessage}
        </div>
      )}

      <div
        className="w-full rounded-2xl p-6 relative shadow-2xl flex flex-col font-sans text-white border border-slate-800/80 h-[520px] max-h-[90vh] overflow-hidden bg-[#12141C]"
        style={{ maxWidth: '600px' }}
      >
        {/* HEADER SECTION */}
        <div className="flex items-center justify-between mb-5 shrink-0">
          <div className="flex items-center gap-2.5">
            <UserPlus className="w-5 h-5 text-indigo-400" />
            <h2 className="text-base font-bold tracking-tight text-white">Project Members</h2>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/60 transition-all focus:outline-none"
            aria-label="Close modal"
          >
            <X className="w-4.5 h-4.5" />
          </button>
        </div>

        {/* SEARCH BAR FOR ADDING MEMBERS */}
        {project.visibility === 'workspace' ? (
          <div className="shrink-0 mb-4 px-4 py-3 bg-indigo-950/20 border border-indigo-900/35 rounded-xl text-xs text-indigo-400 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 shrink-0 animate-pulse" />
            This project has workspace visibility. All workspace members have access automatically.
          </div>
        ) : isCreator ? (
          <div ref={searchContainerRef} className="shrink-0 relative z-50 mb-4">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search workspace members to invite..."
                value={searchQuery}
                onFocus={() => setShowSuggestions(true)}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-11 bg-slate-900/60 border border-slate-800/80 rounded-xl pl-10 pr-4 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all"
                disabled={isLoading}
              />
            </div>

            {/* Suggestions list */}
            {showSuggestions && searchQuery && (
              <div className="absolute top-full left-0 right-0 mt-1.5 bg-[#171923] border border-slate-800/95 rounded-xl shadow-2xl overflow-hidden z-50 max-h-52 overflow-y-auto divide-y divide-slate-800/30">
                <div className="p-2 text-[10px] font-bold text-slate-500 uppercase tracking-wider bg-slate-950/20">
                  Workspace Members
                </div>
                {filteredSuggestions.length === 0 ? (
                  <div className="p-3.5 text-xs text-slate-400 text-center">
                    No matching workspace members found
                  </div>
                ) : (
                  filteredSuggestions.map((member) => {
                    const username = member.username || member.name || member.email || 'User';
                    return (
                      <button
                        key={member._id}
                        type="button"
                        onClick={() => handleInviteMember(member._id, username)}
                        className="w-full flex items-center gap-3 px-3.5 py-2.5 hover:bg-slate-900/50 transition-colors text-left"
                      >
                        {member.avatar ? (
                          <img
                            src={member.avatar}
                            alt={username}
                            className="w-7 h-7 rounded-full object-cover shrink-0"
                          />
                        ) : (
                          <div className="w-7 h-7 rounded-full bg-indigo-650 flex items-center justify-center text-[10px] font-extrabold text-white shrink-0">
                            {getInitials(username)}
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-semibold text-slate-200 truncate">{username}</p>
                          <p className="text-[10px] text-slate-450 truncate">{member.email}</p>
                        </div>
                        <span className="text-[10px] font-bold text-indigo-400 shrink-0">Add to project</span>
                      </button>
                    );
                  })
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="shrink-0 mb-4 px-4 py-3 bg-slate-900/40 border border-slate-800/50 rounded-xl text-xs text-slate-400 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-500 shrink-0" />
            Only the project creator ({project.createdBy?.username || 'Owner'}) can invite members.
          </div>
        )}

        {/* MEMBERS LIST */}
        <div className="flex-1 flex flex-col min-h-0">
          <span className="text-[10px] font-extrabold tracking-wider text-slate-500 uppercase shrink-0">
            Project Members [{displayMembers.length + 1}]
          </span>
          
          <div className="h-[1px] w-full bg-slate-800/60 my-2.5 shrink-0" />

          <div className="flex-1 overflow-y-auto pr-1 space-y-3 scrollbar-thin">
            {/* Creator Row */}
            <div className="flex items-center justify-between py-1">
              <div className="flex items-center gap-3 min-w-0">
                {project.createdBy?.avatar ? (
                  <img
                    src={project.createdBy.avatar}
                    alt={project.createdBy.username}
                    className="w-8.5 h-8.5 rounded-full object-cover border border-indigo-500/20 shrink-0"
                  />
                ) : (
                  <div className="w-8.5 h-8.5 rounded-full bg-indigo-600 flex items-center justify-center text-[10px] font-black text-white shrink-0">
                    {getInitials(project.createdBy?.username)}
                  </div>
                )}
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-xs font-bold text-slate-100">{project.createdBy?.username || 'Owner'}</p>
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center gap-1">
                      <Crown className="w-2.5 h-2.5" />
                      Owner
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-500 truncate mt-0.5">{project.createdBy?.email}</p>
                </div>
              </div>
            </div>

            {/* Invited/Workspace Members */}
            {displayMembers.map((memberUser) => {
              const username = memberUser.username || memberUser.name || memberUser.email || 'User';
              const memberId = memberUser._id || memberUser.id;

              return (
                <div key={memberId} className="flex items-center justify-between py-1 group">
                  <div className="flex items-center gap-3 min-w-0">
                    {memberUser.avatar ? (
                      <img
                        src={memberUser.avatar}
                        alt={username}
                        className="w-8.5 h-8.5 rounded-full object-cover shrink-0"
                      />
                    ) : (
                      <div className="w-8.5 h-8.5 rounded-full bg-slate-700 flex items-center justify-center text-[10px] font-black text-white shrink-0">
                        {getInitials(username)}
                      </div>
                    )}
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-xs font-bold text-slate-100">{username}</p>
                        {currentUser?._id === memberId && (
                          <span className="px-2 py-0.5 rounded-full text-[9px] bg-blue-500/15 text-blue-400">
                            You
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-slate-500 truncate mt-0.5">{memberUser.email}</p>
                    </div>
                  </div>

                  {isCreator && project.visibility !== 'workspace' && (
                    <button
                      onClick={() => handleRemoveMember(memberId, username)}
                      disabled={isLoading}
                      className="p-1 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-all focus:outline-none"
                      title="Remove member"
                    >
                      <Trash2 className="w-4.5 h-4.5" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
