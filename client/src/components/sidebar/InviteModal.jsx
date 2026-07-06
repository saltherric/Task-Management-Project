import React, { useState, useRef, useEffect, useMemo } from 'react'
import { getWorkspaceMembers, getAvailableMembers, invitesMember, updateRoleMember } from '../../services/workspaceApi';
import {createInviteLink}  from '../../services/inviteApi';

export default function InviteModal({ isOpen, workspaceId ,onClose}) {
    const [members, setMembers] = useState([]);
    const [availableMembers, setAvailableMembers] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedRole, setSelectedRole] = useState('member');
    const [showSuggestions, setShowSuggestions] = useState(false);
    // const [isLinkCreated, setIsLinkCreated] = useState(false);
    const [inviteLink, setInviteLink] = useState("");
    const [linkCopied, setLinkCopied] = useState(false);
    const [toastMessage, setToastMessage] = useState('');
    const [selectedUsers, setSelectedUsers] = useState([]);

    const searchContainerRef = useRef(null);

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

      fetchMembers(workspaceId);
      fetchAvailableMembers();
    }, [isOpen, workspaceId]);
    
    const fetchMembers = async (workspaceId) => {
      const data = await getWorkspaceMembers(workspaceId);
      setMembers(data.members);
    }

    const fetchAvailableMembers = async () => {
      const data = await getAvailableMembers(workspaceId);
      setAvailableMembers(data.availableMembers);
    }

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
      try {
        const data = await invitesMember(workspaceId, {
          userId: user._id,
        });
        await fetchMembers(workspaceId);
        await fetchAvailableMembers();
      } catch (error) {
        console.error(error);
      }
    }
  
    const handleShareSubmit = async (e) => {
      e.preventDefault();

      if (selectedUsers.length === 0) return;

      try {
        for (const user of selectedUsers) {
          await handleAddMember(user);
        }

        setSelectedUsers([]);
        setSearchQuery('');
        setShowSuggestions(false);

        showToast(`${selectedUsers.length} member(s) invited successfully`);
      } catch (error) {
        console.error(error);
      }
    };  
  
    const handleRoleChange = async ( memberId, newRole) => {
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
    };
  
    const handleLinkAction = async () => {
      try {
          // First click → create link
          if (!inviteLink) {
              const data = await createInviteLink(workspaceId);
              setInviteLink(data.link);
              showToast("Workspace invite link created!");
              return;
          }

          // Second click → copy
          await navigator.clipboard.writeText(inviteLink);
          setLinkCopied(true);
          showToast("Invite link copied!");
          setTimeout(() => {
              setLinkCopied(false);
          }, 2000);

      } catch (error) {

          console.error(error);

          showToast(
              error.response?.data?.message ||
              "Failed to create invite link"
          );
      }
  };
  
    const showToast = (msg) => {
      setToastMessage(msg);
      setTimeout(() => setToastMessage(''), 3000);
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
      <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
        
        {/* Dynamic Toast Feedback Overlay inside Modal */}
        {toastMessage && (
          <div className="absolute top-6 left-1/2 -translate-x-1/2 bg-slate-900 border border-slate-800 text-xs text-indigo-400 font-semibold px-4.5 py-2.5 rounded-xl shadow-2xl z-[60] flex items-center gap-2 animate-bounce">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-ping" />
            {toastMessage}
          </div>
        )}
  
        {/* Modal Card Structure */}
        <div 
          className="w-full rounded-2xl p-6 relative shadow-2xl flex flex-col font-sans text-white border border-slate-800/80 max-h-[90vh] overflow-hidden"
          style={{ backgroundColor: '#1F1F23', maxWidth: '700px' }}
        >
          
          {/* HEADER SECTION */}
          <div className="flex items-center justify-between mb-5 shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-5 h-5 text-indigo-400">
                <svg fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                </svg>
              </div>
              <h2 className="text-base font-bold tracking-tight text-white">Share Workspace</h2>
            </div>
            
            <button 
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/60 transition-all focus:outline-none"
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
                  // required
                  placeholder="Email address or name"
                  value={searchQuery}
                  onFocus={() => setShowSuggestions(true)}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-11 bg-slate-900/60 border border-slate-800/80 rounded-xl px-4 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all"
                />
                 {selectedUsers.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {selectedUsers.map(user => (
                        <div
                          key={user._id}
                          className="flex items-center gap-2 px-3 py-1.5 bg-blue-950 border border-blue-700 rounded-lg"
                        >
                          <span className="text-xs font-medium text-blue-300">
                            {user.username}
                          </span>

                          <button
                            type="button"
                            onClick={() =>
                              setSelectedUsers(prev =>
                                prev.filter(u => u._id !== user._id)
                              )
                            }
                            className="text-blue-300 hover:text-white"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                
                {/* Autocomplete Dropdown List */}
                {showSuggestions && searchQuery && (
                  <div className="absolute top-full left-0 right-0 mt-1.5 bg-[#1F1F23] border border-slate-800/90 rounded-xl shadow-2xl overflow-hidden z-50 max-h-52 overflow-y-auto divide-y divide-slate-800/30">
                    <div className="p-2 text-[10px] font-bold text-slate-500 uppercase tracking-wider bg-slate-950/20">
                      Suggested Team Members
                    </div>
                    {filteredSuggestions.length === 0 ? (
                      <div className="p-3.5 text-xs text-slate-400 text-center">
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
                          className="w-full flex items-center gap-3 px-3.5 py-2.5 hover:bg-slate-900/50 transition-colors text-left"
                        >
                          <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-extrabold text-white shrink-0 ${user.avatarColor}`}>
                            {getInitials(user.username)}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-semibold text-slate-200 truncate">{user.username}</p>
                            <p className="text-[10px] text-slate-450 truncate">{user.email}</p>
                          </div>
                          <span className="text-[10px] font-bold text-indigo-400 shrink-0">Invite</span>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>
  
              {/* Role dropdown Selector */}
              <div className="w-full sm:w-32 shrink-0">
                <select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                  className="w-full h-11 bg-slate-900/60 border border-slate-800/80 rounded-xl px-3 text-xs text-slate-300 font-medium focus:outline-none focus:border-indigo-500 cursor-pointer"
                >
                  <option value="admin">Admin</option>
                  <option value="member">Member</option>
                </select>
              </div>
  
              {/* Blue Primary Share Button */}
              <button
                type="submit"
                className="h-11 bg-[#0082E6] hover:bg-blue-600 active:scale-98 text-white font-bold text-xs px-6 rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5 shrink-0"
              >
                Share
              </button>
  
            </div>
          </form>
  
          {/* SHARE LINK CARD SECTION */}
          <div className="mt-4 p-3 bg-slate-900/40 rounded-xl border border-slate-800/60 flex items-center justify-between gap-3 shrink-0">
            <div className="flex items-center gap-3.5 min-w-0">
              {/* Small square link icon container */}
              <div className="w-9 h-9 rounded-lg bg-slate-900 border border-slate-800/80 flex items-center justify-center shrink-0">
                <svg className="w-4.5 h-4.5 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-slate-200">Share this workspace with a link</p>
                {inviteLink ? (
                  <p className="text-[10px] text-slate-400 truncate mt-0.5 select-all">
                      {inviteLink}
                  </p>
                ) : (
                  <p className="text-[10px] text-slate-500 mt-0.5">
                      Allows anyone with the URL access to join this workspace
                  </p>
                )}
              </div>
            </div>
  
            {/* Action trigger label */}
            <button
              onClick={handleLinkAction}
              className="text-xs font-bold text-[#0082E6] hover:text-blue-400 transition-colors focus:outline-none shrink-0"
            >
              {linkCopied ? (
                <span className="text-emerald-400 flex items-center gap-1">
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
              <span className="text-xs font-extrabold tracking-wider text-slate-450 uppercase">
                Board members [{members.length}]
              </span>
            </div>
  
            {/* Styled Divider below Section Title */}
            <div className="h-[1px] w-full bg-slate-800/60 my-2.5 shrink-0" />
  
            {/* Member List Scroll Area */}
            <div className="flex-1 overflow-y-auto pr-1 space-y-1 scrollbar-thin">
              {members.map((member) => (
                <div 
                  key={member._id} 
                  className="flex items-center justify-between py-3.5 border-b border-slate-800/20 last:border-0"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {/* Circular Avatar with initials */}
                    <div className={`w-8.5 h-8.5 rounded-full flex items-center justify-center text-[10px] font-black text-white shrink-0 ${member.avatarColor || 'bg-slate-700'}`}>
                      {getInitials(member.username)}
                    </div>
                    
                    {/* Profile descriptors */}
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-xs font-bold text-slate-100">{member.username}</p>
                        <span className="text-[10px] text-slate-500 font-medium">{member.email}</span>
                      </div>
                      <p className="text-[10px] text-slate-450 truncate mt-0.5">
                        {member.role === 'admin' ? 'Administrative owner status' : member.role === 'member' ? 'Full editing and workspace access' : 'Read-only access permission'}
                      </p>
                    </div>
                  </div>
  
                  {/* Role Selector on the Right */}
                  <div className="shrink-0 pl-3">
                      <select
                        value={member.role}
                        onChange={(e) =>
                          handleRoleChange(
                            member._id,
                            e.target.value
                          )
                        }
                        className="bg-transparent text-xs font-bold text-slate-400 hover:text-slate-100 transition-colors border-0 outline-none cursor-pointer focus:ring-0 focus:ring-offset-0"
                      >
                      <option value="admin" className="bg-[#1F1F23] text-slate-300">Admin</option>
                      <option value="member" className="bg-[#1F1F23] text-slate-300">Member</option>
                    </select>
                  </div>
  
                </div>
              ))}
            </div>
  
          </div>
  
        </div>
      </div>
    );
}
