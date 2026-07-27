import { useState, useRef, useEffect, useMemo, useCallback, useContext } from 'react'
import { getWorkspaceMembers, getAvailableMembers, invitesMember, updateRoleMember, leaveWorkspace } from '../../services/workspaceApi';
import { createInviteLink } from '../../services/inviteApi';
import { getStoredUserInfo } from "../../helpers/auth";
import { useSocket } from '../../contexts/SocketContext';
import { ThemeContext } from '../../contexts/ThemeContext';
import { useAlert } from '../../contexts/AlertContext';

export default function InviteModal({ isOpen, workspaceId, onClose }) {
  const { theme } = useContext(ThemeContext);
  const isDark = theme === 'dark';

  const [members, setMembers] = useState([]);
  const [availableMembers, setAvailableMembers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState('member');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [inviteLink, setInviteLink] = useState("");
  const [linkCopied, setLinkCopied] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [failedAvatars, setFailedAvatars] = useState({});
  const { showAlert } = useAlert();

  const handleAvatarError = (userId) => {
    setFailedAvatars(prev => ({ ...prev, [userId]: true }));
  };
  const {
    socket,
    isConnected,
    joinWorkspace,
    leaveWorkspace: leaveWorkspaceRoom,
  } = useSocket();

  const searchContainerRef = useRef(null);

  const currentUser = getStoredUserInfo();

  const getMemberUserId = (member) => member?.user?._id || member?._id;

  const currentMember = useMemo(() => {
    return members.find(
      member => getMemberUserId(member) === currentUser?._id
    );
  }, [members, currentUser?._id]);

  const sortedMembers = useMemo(() => {
    const currentUserId = currentUser?._id;
    return [...members].sort((a, b) => {
      const aIsSelf = getMemberUserId(a) === currentUserId;
      const bIsSelf = getMemberUserId(b) === currentUserId;
      if (aIsSelf && !bIsSelf) return -1;
      if (!aIsSelf && bIsSelf) return 1;
      return 0;
    });
  }, [members, currentUser?._id]);

  const isAdmin = currentMember?.role === "admin";

  const fetchMembers = useCallback(async (workspaceId) => {
    const data = await getWorkspaceMembers(workspaceId);
    setMembers(data.members);
  }, []);

  const fetchAvailableMembers = useCallback(async (workspaceId) => {
    const data = await getAvailableMembers(workspaceId);
    setAvailableMembers(data.availableMembers);
  }, []);

  // Close suggestions box if user clicks outside of search input area
  useEffect(() => {
    function handleClickOutside(event) {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!isOpen || !workspaceId) return;

    let isMounted = true;

    const fetchInitialData = async () => {
      const [membersData, availableMembersData] = await Promise.all([
        getWorkspaceMembers(workspaceId),
        getAvailableMembers(workspaceId),
      ]);

      if (!isMounted) return;

      setMembers(membersData.members);
      setAvailableMembers(availableMembersData.availableMembers);
    };

    fetchInitialData();

    return () => {
      isMounted = false;
    };
  }, [isOpen, workspaceId]);

  useEffect(() => {
    if (!socket || !isConnected || !workspaceId || !isOpen) return;

    let isMounted = true;

    const registerWorkspaceRoom = async () => {
      const response = await joinWorkspace(workspaceId);

      if (isMounted && response?.success === false) {
        console.error("Failed to join workspace room:", response.message);
      }
    };

    const handleRoleUpdated = (payload) => {
      if (payload.workspaceId !== workspaceId) return;

      setMembers(prev =>
        prev.map(member =>
          member._id === payload.memberId
            ? { ...member, role: payload.role }
            : member
        )
      );
    };

    registerWorkspaceRoom();
    socket.on("workspace:role_updated", handleRoleUpdated);

    return () => {
      isMounted = false;
      leaveWorkspaceRoom(workspaceId);
      socket.off("workspace:role_updated", handleRoleUpdated);
    };
  }, [socket, isConnected, workspaceId, isOpen, joinWorkspace, leaveWorkspaceRoom]);
  
  const filteredSuggestions = useMemo(() => {
    if (!searchQuery.trim()) return [];

    return availableMembers.filter(
      user =>
        !selectedUsers.some(
          selected => selected._id === user._id
        ) &&
        (
          user.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          user.email?.toLowerCase().includes(searchQuery.toLowerCase())
        )
    );
  }, [searchQuery, availableMembers, selectedUsers]);

  // Handle adding user to active workspace members list
  const handleAddMember = async (user) => {
    return invitesMember(
      workspaceId,
      user._id,
      selectedRole
    );
  }

  const handleShareSubmit = async (e) => {
    e.preventDefault();

    if (selectedUsers.length === 0) return;

    try {
      for (const user of selectedUsers) {
        await handleAddMember(user);
      }
      await Promise.all([
        fetchMembers(workspaceId),
        fetchAvailableMembers(workspaceId),
      ]);

      setSelectedUsers([]);
      setSearchQuery('');
      setShowSuggestions(false);

      showAlert(`${selectedUsers.length} member(s) invited successfully.`, 'success');
    } catch (error) {
      console.error(error);
      showAlert(
        error.response?.data?.message ||
        "Failed to invite members.",
        'error'
      );
    }
  };
  const handleLeaveWorkspace = async () => {

    const confirmed = window.confirm(
      "Leave this workspace?"
    );

    if (!confirmed) return;

    try {

      await leaveWorkspace(workspaceId);

      showAlert("Left workspace successfully.", 'success');

      onClose();

    } catch (error) {

      showAlert(
        error.response?.data?.message ||
        "Unable to leave workspace.",
        'error'
      );

    }
  };

  const handleRoleChange = async (memberId, newRole) => {
    try {
      await updateRoleMember(
        workspaceId,
        memberId,
        newRole
      );

      setMembers(prev =>
        prev.map(member =>
          member._id === memberId
            ? { ...member, role: newRole }
            : member
        )
      );

      showAlert("Role updated successfully.", 'success');
    } catch (error) {
      showAlert(
        error.response?.data?.message ||
        "Failed to update role.",
        'error'
      );
    }
  };

  const handleLinkAction = async () => {
    try {
      // Create invite link
      if (!inviteLink) {
        const { link } = await createInviteLink(
          workspaceId,
          selectedRole
        );

        setInviteLink(link);

        await navigator.clipboard.writeText(link);

        setLinkCopied(true);

        showAlert(
          `${selectedRole.charAt(0).toUpperCase() + selectedRole.slice(1)} invite link created & copied!`,
          'success'
        );

        setTimeout(() => {
          setLinkCopied(false);
        }, 2000);

        return;
      }

      // Copy existing link
      await navigator.clipboard.writeText(inviteLink);

      setLinkCopied(true);

      showAlert("Invite link copied!", 'success');

      setTimeout(() => {
        setLinkCopied(false);
      }, 2000);

    } catch (error) {
      console.error(error);

      showAlert(
        error.response?.data?.message ||
        "Failed to create invite link.",
        'error'
      );
    }
  };

  // Extract Initials for user avatars
  const getInitials = (username) => {
    return username
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map(word => word[0])
      .join('')
      .toUpperCase();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/15 backdrop-blur-[2px] flex items-center justify-center p-4">

      {/* Modal Card Structure */}
      <div
        className={`w-full rounded-2xl p-6 relative shadow-2xl flex flex-col font-sans border h-[580px] max-h-[90vh] overflow-hidden transition-all duration-300 ${
          isDark 
            ? 'bg-[#12141A] border-slate-800/80 text-white' 
            : 'bg-white border-slate-200 text-slate-800'
        }`}
        style={{ maxWidth: '700px' }}
      >

        {/* HEADER SECTION */}
        <div className="flex items-center justify-between mb-5 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-5 h-5 text-indigo-400">
              <svg fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
            </div>
            <h2 className={`text-base font-bold tracking-tight ${isDark ? 'text-white' : 'text-slate-850'}`}>Share Workspace</h2>
          </div>

          <button
            onClick={onClose}
            className={`p-1.5 rounded-xl transition-all focus:outline-none ${
              isDark 
                ? 'text-slate-400 hover:text-white hover:bg-slate-800/60' 
                : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'
            }`}
            aria-label="Close modal"
          >
            <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* SHARE BAR ROW SECTION */}
        <form onSubmit={handleShareSubmit} className="shrink-0 space-y-4 relative z-40">
          <div className="flex flex-col sm:flex-row items-stretch gap-2.5">

            {/* Search/Input Field & Autocomplete dropdown */}
            <div ref={searchContainerRef} className="flex-1 relative">
              <input
                type="text"
                disabled={!isAdmin}
                placeholder={isAdmin ? "Email address or name" : "Only admins can invite members"}
                value={searchQuery}
                onFocus={() => setShowSuggestions(true)}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`w-full h-11 border rounded-xl px-4 text-xs focus:outline-none focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/10 transition-all disabled:cursor-not-allowed disabled:opacity-50 ${
                  isDark 
                    ? 'bg-slate-900/40 border-slate-800/80 text-slate-200 placeholder-slate-500' 
                    : 'bg-slate-50/50 border-slate-200 text-slate-850 placeholder-slate-400'
                }`}
              />
              {selectedUsers.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {selectedUsers.map(user => (
                    <div
                      key={user._id}
                      className={`flex items-center gap-2 px-3 py-1.5 border rounded-lg ${
                        isDark 
                          ? 'bg-blue-950 border-blue-700 text-blue-300' 
                          : 'bg-blue-50 border-blue-200 text-blue-700'
                      }`}
                    >
                      <span className="text-xs font-medium">
                        {user.username}
                      </span>

                      <button
                        type="button"
                        onClick={() =>
                          setSelectedUsers(prev =>
                            prev.filter(u => u._id !== user._id)
                          )
                        }
                        className={`${isDark ? 'text-blue-300 hover:text-white' : 'text-blue-700 hover:text-blue-900'}`}
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Autocomplete Dropdown List */}
              {showSuggestions && searchQuery && (
                <div className={`absolute top-full left-0 right-0 mt-1.5 border rounded-xl shadow-2xl overflow-hidden z-50 max-h-52 overflow-y-auto divide-y ${
                  isDark 
                    ? 'bg-[#12141A] border-slate-800/90 divide-slate-800/30' 
                    : 'bg-white border-slate-250 divide-slate-150'
                }`}>
                  <div className={`p-2 text-[10px] font-bold uppercase tracking-wider ${
                    isDark ? 'text-slate-500 bg-slate-950/20' : 'text-slate-400 bg-slate-50'
                  }`}>
                    Suggested Team Members
                  </div>
                  {filteredSuggestions.length === 0 ? (
                    <div className={`p-3.5 text-xs text-center ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                      No matches. Press Enter or Share to invite custom email.
                    </div>
                  ) : (
                    filteredSuggestions.map((user) => (
                      <button
                        key={user.email}
                        type="button"
                        onClick={() => {
                          const exists = selectedUsers.some(
                            selected => selected._id === user._id
                          );

                          if (exists) return;

                          setSelectedUsers(prev => [...prev, user]);

                          setSearchQuery('');
                          setShowSuggestions(true);
                        }}
                        className={`w-full flex items-center gap-3 px-3.5 py-2.5 transition-colors text-left ${
                          isDark ? 'hover:bg-slate-900/50' : 'hover:bg-slate-50'
                        }`}
                      >
                        {user.avatar && !failedAvatars[user._id] ? (
                          <img 
                            src={user.avatar} 
                            alt="" 
                            onError={() => handleAvatarError(user._id)}
                            className="w-7 h-7 rounded-full object-cover shrink-0" 
                          />
                        ) : (
                          <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-extrabold text-white shrink-0 ${user.avatarColor}`}>
                            {getInitials(user.username)}
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <p className={`text-xs font-semibold truncate ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>{user.username}</p>
                          <p className={`text-[10px] truncate ${isDark ? 'text-slate-450' : 'text-slate-500'}`}>{user.email}</p>
                        </div>
                        <span className="text-[10px] font-bold text-indigo-400 shrink-0">Invite</span>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* Role Selector */}
            <div className="w-full sm:w-32 shrink-0">
              <select
                value={selectedRole}
                disabled={!isAdmin}
                onChange={(e) => setSelectedRole(e.target.value)}
                className={`w-full h-11 rounded-xl border px-3 text-sm focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/10 focus:outline-none cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 ${
                  isDark 
                    ? 'border-slate-800/80 bg-slate-900/40 text-slate-300' 
                    : 'border-slate-200 bg-slate-50/50 text-slate-700'
                }`}
              >
                <option value="member" className={isDark ? 'bg-[#12141A]' : 'bg-white'}>Member</option>
                <option value="admin" className={isDark ? 'bg-[#12141A]' : 'bg-white'}>Admin</option>
              </select>
            </div>

            {/* Blue Primary Share Button */}
            <button
              type="submit"
              disabled={!isAdmin}
              className="h-11 bg-indigo-600 enabled:hover:bg-indigo-700 enabled:active:scale-98 text-white font-semibold text-xs px-6 rounded-xl transition-all shadow-lg shadow-indigo-600/15 hover:shadow-indigo-600/25 flex items-center justify-center gap-1.5 shrink-0 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
            >
              Share
            </button>

          </div>
        </form>

        {/* SHARE LINK CARD SECTION */}
        <div className={`mt-4 p-3 rounded-xl border flex items-center justify-between gap-3 shrink-0 ${
          isDark ? 'bg-slate-900/40 border-slate-800/60' : 'bg-slate-50 border-slate-200'
        }`}>
          <div className="flex items-center gap-3.5 min-w-0">
            {/* Small square link icon container */}
            <div className={`w-9 h-9 rounded-lg border flex items-center justify-center shrink-0 ${
              isDark ? 'bg-slate-900 border-slate-800/80' : 'bg-white border-slate-250'
            }`}>
              <svg className="w-4.5 h-4.5 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
            </div>
            <div className="min-w-0">
              <p className={`text-xs font-bold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>Share this workspace with a link</p>
              {inviteLink ? (
                <p className={`text-[10px] truncate mt-0.5 select-all ${isDark ? 'text-slate-400' : 'text-slate-650'}`}>
                  {inviteLink}
                </p>
              ) : (
                <p className={`text-[10px] mt-0.5 ${isDark ? 'text-slate-500' : 'text-slate-450'}`}>
                  Allows anyone with the URL access to join this workspace
                </p>
              )}
            </div>
          </div>

          {/* Action trigger label */}
          <button
            onClick={handleLinkAction}
            disabled={!isAdmin && !inviteLink}
            className="text-xs font-bold text-[#6366F1] enabled:hover:text-indigo-400 transition-colors focus:outline-none shrink-0 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {linkCopied ? (
              <span className="text-emerald-450 flex items-center gap-1">
                ✓ Copied
              </span>
            ) : inviteLink ? (
              "Copy link"
            ) : (
              "Create link"
            )
            }
          </button>
        </div>

        {/* MEMBERS AREA SECTION */}
        <div className="mt-5 flex-1 flex flex-col min-h-0">
          <div className="flex items-center justify-between shrink-0">
            <span className={`text-xs font-extrabold tracking-wider uppercase ${isDark ? 'text-slate-450' : 'text-slate-500'}`}>
              Workspace members [{members.length}]
            </span>
          </div>

          {/* Styled Divider below Section Title */}
          <div className={`h-[1px] w-full my-2.5 shrink-0 ${isDark ? 'bg-slate-800/60' : 'bg-slate-200'}`} />

          {/* Member List Scroll Area */}
          <div className="flex-1 overflow-y-auto pr-1 space-y-1 scrollbar-thin">
            {sortedMembers.map((member) => {
              const isSelf = getMemberUserId(member) === currentUser?._id;
              const canOpenDropdown = isAdmin || isSelf;
              const canChangeRole = isAdmin && !isSelf;

              return (
                <div
                  key={member._id}
                  className={`flex items-center justify-between py-3.5 border-b last:border-0 ${
                    isDark ? 'border-slate-800/20' : 'border-slate-100'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {/* Circular Avatar with initials */}
                    {member.avatar && !failedAvatars[member._id] ? (
                      <img 
                        src={member.avatar} 
                        alt="" 
                        onError={() => handleAvatarError(member._id)}
                        className="w-8.5 h-8.5 rounded-full object-cover shrink-0" 
                      />
                    ) : (
                      <div className={`w-8.5 h-8.5 rounded-full flex items-center justify-center text-[10px] font-black text-white shrink-0 ${member.avatarColor || 'bg-slate-700'}`}>
                        {getInitials(member.username)}
                      </div>
                    )}

                    {/* Profile descriptors */}
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className={`text-xs font-bold ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>{member.username}</p>
                        <span className={`text-[10px] font-medium flex items-center gap-2 ${isDark ? 'text-slate-500' : 'text-slate-600'}`}>
                          {member.email}
                          {isSelf && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] bg-blue-500/20 text-blue-500">
                              You
                            </span>
                          )}
                        </span>
                      </div>
                      <p className={`text-[10px] truncate mt-0.5 ${isDark ? 'text-slate-450' : 'text-slate-550'}`}>
                        {member.role === 'admin' ? 'Administrative owner status' : member.role === 'member' ? 'Full editing and workspace access' : 'Read-only access permission'}
                      </p>
                    </div>
                  </div>

                  {/* Role Selector on the Right */}
                  <div className="shrink-0 pl-3">
                    <select
                      value={isSelf ? "__self__" : member.role}
                      disabled={!canOpenDropdown}
                      onChange={(e) => {

                        if (e.target.value === "leave") {
                          handleLeaveWorkspace();
                          return;
                        }

                        if (!canChangeRole) return;

                        handleRoleChange(
                          member._id,
                          e.target.value
                        );
                      }}

                      className={`w-[85px] bg-transparent text-xs font-bold border-0 outline-none focus:ring-0 focus:ring-offset-0 transition-colors ${
                        canOpenDropdown
                          ? isDark ? "cursor-pointer text-slate-400 hover:text-slate-100" : "cursor-pointer text-slate-500 hover:text-slate-800"
                          : "cursor-not-allowed text-slate-600"
                      }`}
                    >
                      {isSelf ? (
                        <>
                          <option value="__self__" className={isDark ? "bg-[#1F1F23]" : "bg-white"}>
                            {member.role === "admin" ? "Admin" : "Member"}
                          </option>
                          <option value="leave" className={`${isDark ? "bg-[#1F1F23]" : "bg-white"} text-rose-500`}>
                            Leave Workspace
                          </option>
                        </>
                      ) : (
                        <>
                          <option value="admin" className={isDark ? "bg-[#1F1F23]" : "bg-white"}>Admin</option>
                          <option value="member" className={isDark ? "bg-[#1F1F23]" : "bg-white"}>Member</option>
                        </>
                      )}
                    </select>
                  </div>
                </div>
              );
            })}
          </div>

        </div>

      </div>
    </div>
  );
}
