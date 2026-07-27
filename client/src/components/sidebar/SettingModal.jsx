import { useCallback, useEffect, useMemo, useRef, useState, useContext } from 'react';
import { connectTelegram } from '../../services/telegramApi';
import { useSocket } from '../../contexts/SocketContext';
import { getWorkspaceMembers, updateRoleMember, updateWorkspace, deleteWorkspace } from '../../services/workspaceApi';
import { getStoredUserInfo } from '../../helpers/auth';
import useAutoSave from '../../hooks/useAutoSave';
import { ThemeContext } from '../../contexts/ThemeContext';
import { useAlert } from '../../contexts/AlertContext';

const getInitials = (value = '') => {
  const initials = value
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(part => part[0])
    .join('')
    .toUpperCase();

  return initials || 'U';
};

const formatRole = (role) => role?.charAt(0).toUpperCase() + role?.slice(1) || 'Member';

const saveStatusLabel = {
  saved: 'Saved',
  dirty: 'Unsaved changes',
  saving: 'Saving...',
  error: 'Save failed',
};

export default function SettingModal({
  isOpen,
  workspaceId,
  workspace,
  onClose,
  onWorkspaceUpdated,
  onWorkspaceDeleted,
}) {
  const { theme } = useContext(ThemeContext);
  const isDark = theme === 'dark';

  const [activeTab, setActiveTab] = useState('general');
  const [members, setMembers] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
  });
  const [dirtyFields, setDirtyFields] = useState({});
  const [saveStatus, setSaveStatus] = useState('saved');
  const [isLoadingMembers, setIsLoadingMembers] = useState(false);
  const [isConnectingTelegram, setIsConnectingTelegram] = useState(false);
  const [updatingMemberId, setUpdatingMemberId] = useState('');
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [isDeletingWorkspace, setIsDeletingWorkspace] = useState(false);
  const { showAlert } = useAlert();

  const { socket, joinWorkspace, leaveWorkspace } = useSocket();

  const currentUser = useMemo(() => getStoredUserInfo(), []);
  const currentUserId = currentUser?._id || currentUser?.id;
  const dirtyFieldsRef = useRef({});

  const currentMember = useMemo(() => {
    return members.find(member => member._id === currentUserId);
  }, [members, currentUserId]);

  const sortedMembers = useMemo(() => {
    return [...members].sort((a, b) => {
      const aIsSelf = a._id === currentUserId;
      const bIsSelf = b._id === currentUserId;
      if (aIsSelf && !bIsSelf) return -1;
      if (!aIsSelf && bIsSelf) return 1;
      return 0;
    });
  }, [members, currentUserId]);

  const canManageRoles = currentMember?.role === 'admin';

  const isWorkspaceAdmin = useMemo(() => {
    const matchInState = members.find(m => m._id === currentUserId);
    if (matchInState) return matchInState.role === 'admin';

    if (workspace?.members) {
      const match = workspace.members.find(
        m => (m.user?._id || m.user) === currentUserId
      );
      if (match) return match.role === 'admin';
    }

    return false;
  }, [workspace, members, currentUserId]);

  const loadMembers = useCallback(async () => {
    if (!workspaceId) return;

    try {
      setIsLoadingMembers(true);
      const data = await getWorkspaceMembers(workspaceId);
      setMembers(data.members || []);
    } catch (error) {
      console.error('Failed to load workspace members', error);
      showAlert(error.response?.data?.message || 'Unable to load workspace members.', 'error');
    } finally {
      setIsLoadingMembers(false);
    }
  }, [showAlert, workspaceId]);

  useEffect(() => {
    if (!isOpen) return;

    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadMembers();
  }, [isOpen, loadMembers]);

  useEffect(() => {
    if (!isOpen) return;

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setFormData({
      name: workspace?.name || '',
      description: workspace?.description || '',
    });
    dirtyFieldsRef.current = {};
    setDirtyFields({});
    setSaveStatus('saved');
    setIsConfirmingDelete(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, workspace?._id]);

  useEffect(() => {
    if (!isOpen || !workspaceId || !socket) return;

    let isMounted = true;

    const registerWorkspaceRoom = async () => {
      const response = await joinWorkspace(workspaceId);
      if (isMounted && response?.success === false) {
        console.error("Failed to join workspace room:", response.message);
      }
    };

    registerWorkspaceRoom();

    const handleWorkspaceUpdated = (payload) => {
      if (payload.workspaceId !== workspaceId) return;
      setFormData(prev => {
        const nextFormData = { ...prev };
        if (!dirtyFieldsRef.current.name && payload.workspace?.name !== undefined) {
          nextFormData.name = payload.workspace.name;
        }
        if (!dirtyFieldsRef.current.description && payload.workspace?.description !== undefined) {
          nextFormData.description = payload.workspace.description;
        }
        return nextFormData;
      });
      onWorkspaceUpdated?.({
        ...workspace,
        ...payload.workspace,
      });
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

    const handleWorkspaceDeleted = (payload) => {
      if (payload.workspaceId !== workspaceId) return;
      onWorkspaceDeleted?.(workspaceId);
      onClose();
    };

    socket.on("workspace:updated", handleWorkspaceUpdated);
    socket.on("workspace:role_updated", handleRoleUpdated);
    socket.on("workspace:deleted", handleWorkspaceDeleted);

    return () => {
      isMounted = false;
      leaveWorkspace(workspaceId);
      socket.off("workspace:updated", handleWorkspaceUpdated);
      socket.off("workspace:role_updated", handleRoleUpdated);
      socket.off("workspace:deleted", handleWorkspaceDeleted);
    };
  }, [isOpen, workspaceId, socket, joinWorkspace, leaveWorkspace, onWorkspaceUpdated, onWorkspaceDeleted, onClose, workspace]);

  useAutoSave(
    dirtyFields,
    async () => {
      if (!isWorkspaceAdmin) return;
      if (!workspaceId || Object.keys(dirtyFields).length === 0) return;

      const payload = Object.entries(dirtyFields).reduce((result, [field, value]) => ({
        ...result,
        [field]: value.trim(),
      }), {});

      if ('name' in payload && !payload.name) {
        setSaveStatus('error');
        showMessage('Workspace name is required.');
        return;
      }

      try {
        setSaveStatus('saving');
        const response = await updateWorkspace(workspaceId, payload);
        const updatedWorkspace = {
          ...workspace,
          ...(response.workspace || {}),
          ...payload,
          _id: workspaceId,
        };

        onWorkspaceUpdated?.(updatedWorkspace);
        const nextDirtyFields = { ...dirtyFieldsRef.current };

        Object.entries(payload).forEach(([field, value]) => {
          if (nextDirtyFields[field]?.trim() === value) {
            delete nextDirtyFields[field];
          }
        });

        dirtyFieldsRef.current = nextDirtyFields;
        setDirtyFields(nextDirtyFields);
        setSaveStatus(Object.keys(nextDirtyFields).length > 0 ? 'dirty' : 'saved');
      } catch (error) {
        console.error('Failed to update workspace', error);
        setSaveStatus('error');
        showAlert(error.response?.data?.message || 'Failed to update workspace.', 'error');
      }
    },
    1000
  );

  const handleConnectTelegram = async () => {
    try {
      setIsConnectingTelegram(true);
      const response = await connectTelegram();

      if (response?.url) {
        window.open(response.url, '_blank', 'noopener,noreferrer');
        showAlert('Telegram connection opened in a new tab.', 'info');
      } else {
        showAlert('Telegram link was not returned by the server.', 'warning');
      }
    } catch (error) {
      console.error('Failed to create Telegram connection link', error);
      showAlert(error.response?.data?.message || 'Failed to create Telegram connection link.', 'error');
    } finally {
      setIsConnectingTelegram(false);
    }
  };

  const handleWorkspaceChange = (event) => {
    if (!isWorkspaceAdmin) return;
    const { name, value } = event.target;
    const nextDirtyFields = { ...dirtyFields };
    const normalizedValue = value.trim();
    const originalValue = (workspace?.[name] || '').trim();

    if (normalizedValue === originalValue) {
      delete nextDirtyFields[name];
    } else {
      nextDirtyFields[name] = value;
    }

    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
    dirtyFieldsRef.current = nextDirtyFields;
    setDirtyFields(nextDirtyFields);
    setSaveStatus(Object.keys(nextDirtyFields).length > 0 ? 'dirty' : 'saved');
  };

  const handleRoleChange = async (memberId, role) => {
    if (!canManageRoles || memberId === currentUserId) return;

    try {
      setUpdatingMemberId(memberId);
      await updateRoleMember(workspaceId, memberId, role);
      setMembers(prev =>
        prev.map(member =>
          member._id === memberId
            ? { ...member, role }
            : member
        )
      );
      showAlert('Member role updated successfully.', 'success');
    } catch (error) {
      console.error('Failed to update member role', error);
      showAlert(error.response?.data?.message || 'Failed to update member role.', 'error');
    } finally {
      setUpdatingMemberId('');
    }
  };

  const handleDeleteWorkspace = async () => {
    if (!workspaceId) return;

    try {
      setIsDeletingWorkspace(true);
      await deleteWorkspace(workspaceId);
      showAlert('Workspace deleted successfully.', 'success');
      onClose();
      onWorkspaceDeleted?.(workspaceId);
    } catch (error) {
      console.error('Failed to delete workspace', error);
      showAlert(error.response?.data?.message || 'Failed to delete workspace.', 'error');
    } finally {
      setIsDeletingWorkspace(false);
      setIsConfirmingDelete(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/15 p-4 backdrop-blur-[2px]">

      <div className={`flex h-[580px] max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border transition-all duration-300 shadow-2xl ${
        isDark 
          ? 'border-slate-800/80 bg-[#12141A] text-white' 
          : 'border-slate-200 bg-white text-slate-800'
      }`}>
        <div className={`flex shrink-0 items-center justify-between border-b px-6 py-5 ${
          isDark ? 'border-slate-800/70' : 'border-slate-200'
        }`}>
          <div className="flex items-center gap-2.5">
            <div className="w-5 h-5 text-indigo-400">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <h2 className={`text-base font-bold tracking-tight ${isDark ? 'text-white' : 'text-slate-800'}`}>
              Workspace Settings: {workspace?.name || 'Selected workspace'}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className={`rounded-xl p-1.5 transition-colors ${
              isDark 
                ? 'text-slate-400 hover:bg-slate-800/70 hover:text-white' 
                : 'text-slate-400 hover:bg-slate-100 hover:text-slate-700'
            }`}
            aria-label="Close settings"
          >
            <svg className="h-4.5 w-4.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className={`flex shrink-0 border-b px-6 ${isDark ? 'border-slate-800/70' : 'border-slate-200'}`}>
          {[
            { id: 'general', label: 'General' },
            { id: 'members', label: `Members [${members.length}]` },
          ].map(tab => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`border-b-2 px-1 py-3 text-xs font-bold transition-colors ${
                activeTab === tab.id
                  ? isDark ? 'border-indigo-400 text-indigo-300' : 'border-indigo-500 text-indigo-650'
                  : isDark ? 'border-transparent text-slate-500 hover:text-slate-300' : 'border-transparent text-slate-400 hover:text-slate-650'
              } ${tab.id === 'members' ? 'ml-6' : ''}`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'general' ? (
            <div className="space-y-5">
              <div className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className={`mb-2 block text-[10px] font-bold uppercase tracking-wider ${isDark ? 'text-slate-500' : 'text-slate-450'}`}>
                      Workspace Name
                    </label>
                    <input
                      name="name"
                      value={formData.name}
                      disabled={!isWorkspaceAdmin}
                      onChange={handleWorkspaceChange}
                      maxLength={80}
                      className={`h-11 w-full border rounded-xl px-3.5 py-2.5 text-sm transition-all focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/10 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 ${
                        isDark 
                          ? 'border-slate-800/80 bg-slate-900/40 text-slate-200 placeholder-slate-600' 
                          : 'border-slate-200 bg-slate-50/50 text-slate-850 placeholder-slate-400'
                      }`}
                    />
                  </div>

                  <div>
                    <label className={`mb-2 block text-[10px] font-bold uppercase tracking-wider ${isDark ? 'text-slate-500' : 'text-slate-450'}`}>
                      Your Role
                    </label>
                    <input
                      value={formatRole(currentMember?.role)}
                      readOnly
                      className={`cursor-not-allowed h-11 w-full border rounded-xl px-3.5 py-2.5 text-sm outline-none ${
                        isDark 
                          ? 'border-slate-800/80 bg-slate-900/40 text-slate-250' 
                          : 'border-slate-200 bg-slate-100/50 text-slate-600'
                      }`}
                    />
                  </div>
                </div>

                <div>
                  <label className={`mb-2 block text-[10px] font-bold uppercase tracking-wider ${isDark ? 'text-slate-500' : 'text-slate-450'}`}>
                    Description
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    disabled={!isWorkspaceAdmin}
                    onChange={handleWorkspaceChange}
                    rows={3}
                    maxLength={500}
                    className={`w-full resize-none border rounded-xl px-3.5 py-2.5 text-sm outline-none transition-all focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/10 disabled:cursor-not-allowed disabled:opacity-50 ${
                      isDark 
                        ? 'border-slate-800/80 bg-slate-900/40 text-slate-200 placeholder-slate-600' 
                        : 'border-slate-200 bg-slate-50/50 text-slate-850 placeholder-slate-400'
                    }`}
                  />
                </div>

                <div className={`text-right text-xs font-semibold ${saveStatus === 'error' ? 'text-rose-350' : 'text-slate-550'}`}>
                  {saveStatusLabel[saveStatus]}
                </div>
              </div>

              <div className="rounded-xl border border-sky-500/20 bg-sky-500/5 p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <h3 className={`text-sm font-bold ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>
                      Telegram Bot Connection
                    </h3>
                    <p className={`mt-1 text-xs leading-5 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                      Connect Telegram to receive workspace notifications for task updates, comments, and checklist activity.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleConnectTelegram}
                    disabled={isConnectingTelegram}
                    className="flex h-10 shrink-0 items-center gap-2 rounded-xl bg-[#6366F1] px-4 text-xs font-bold text-white transition-colors hover:bg-indigo-600 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21.75 4.5L12 13.5M21.75 4.5L15.75 21l-3.75-7.5L4.5 12l17.25-7.5z" />
                    </svg>
                    {isConnectingTelegram ? 'Preparing...' : 'Connect'}
                  </button>
                </div>
              </div>

              {/* Danger Zone (only for admins) */}
              {canManageRoles && (
                <div className="space-y-4">
                  <div className="relative flex py-2 items-center">
                    <div className="flex-grow border-t border-rose-500/30"></div>
                    <span className="flex-shrink mx-4 text-xs font-bold text-rose-500 tracking-wider uppercase">
                      Danger Zone
                    </span>
                    <div className="flex-grow border-t border-rose-500/30"></div>
                  </div>

                  <div className="rounded-xl border border-rose-500/20 bg-rose-500/5 p-4">
                    <p className="mb-4 text-xs leading-5 text-slate-350">
                      Deleting this workspace will permanently remove all associated projects, boards, lists, tasks, and data. This action cannot be undone.
                    </p>

                    {!isConfirmingDelete ? (
                      <button
                        type="button"
                        onClick={() => setIsConfirmingDelete(true)}
                        className="flex w-full items-center justify-center gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 py-2.5 text-xs font-bold text-rose-450 transition-colors hover:bg-rose-500 hover:text-white"
                      >
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        Permanently Delete Workspace
                      </button>
                    ) : (
                      <div className="space-y-3 rounded-xl bg-rose-500/10 p-3.5 border border-rose-500/20">
                        <p className="text-xs font-semibold text-rose-350">
                          Are you absolutely sure you want to delete this workspace and all its data?
                        </p>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={handleDeleteWorkspace}
                            disabled={isDeletingWorkspace}
                            className="flex-1 rounded-xl bg-rose-600 py-2.5 text-xs font-bold text-white transition-colors hover:bg-rose-700 disabled:opacity-50 cursor-pointer shadow-lg shadow-rose-600/10 hover:shadow-rose-600/20"
                          >
                            {isDeletingWorkspace ? 'Deleting...' : 'Yes, Delete it'}
                          </button>
                          <button
                            type="button"
                            onClick={() => setIsConfirmingDelete(false)}
                            disabled={isDeletingWorkspace}
                            className={`flex-1 rounded-xl border py-2.5 text-xs font-bold transition-all disabled:opacity-50 cursor-pointer ${
                              isDark 
                                ? 'border-slate-800/80 bg-slate-900/40 text-slate-300 hover:bg-slate-800/50' 
                                : 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-650'
                            }`}
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {!canManageRoles && (
                <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 px-4 py-3 text-xs text-amber-300">
                  Only workspace admins can change member roles.
                </div>
              )}

              {isLoadingMembers ? (
                <div className={`py-10 text-center text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  Loading members...
                </div>
              ) : members.length === 0 ? (
                <div className={`py-10 text-center text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  No members found.
                </div>
              ) : (
                sortedMembers.map(member => {
                  const isSelf = member._id === currentUserId;
                  const username = member.username || member.name || member.email || 'User';

                  return (
                    <div
                      key={member._id}
                      className={`flex items-center justify-between gap-4 rounded-xl border px-4 py-3 transition-colors duration-300 ${
                        isDark 
                          ? 'border-slate-800/70 bg-slate-900/30' 
                          : 'border-slate-200 bg-slate-50/50'
                      }`}
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-xs font-black text-white">
                          {getInitials(username)}
                        </div>
                        <div className="min-w-0">
                          <div className="flex min-w-0 items-center gap-2">
                            <p className={`truncate text-sm font-bold ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>
                              {username}
                            </p>
                            {isSelf && (
                              <span className="shrink-0 rounded-full bg-blue-500/15 px-2 py-0.5 text-[10px] font-bold text-blue-500">
                                You
                              </span>
                            )}
                          </div>
                          <p className={`truncate text-xs ${isDark ? 'text-slate-500' : 'text-slate-600'}`}>
                            {member.email}
                          </p>
                        </div>
                      </div>

                      <select
                        value={member.role || 'member'}
                        disabled={!canManageRoles || isSelf || updatingMemberId === member._id}
                        onChange={(event) => handleRoleChange(member._id, event.target.value)}
                        className={`h-9 shrink-0 rounded-lg border px-3 text-xs font-bold outline-none disabled:cursor-not-allowed disabled:opacity-50 ${
                          isDark 
                            ? 'border-slate-800 bg-slate-950/70 text-slate-300' 
                            : 'border-slate-300 bg-white text-slate-700'
                        }`}
                      >
                        <option value="admin" className={isDark ? 'bg-[#1F1F23]' : 'bg-white'}>Admin</option>
                        <option value="member" className={isDark ? 'bg-[#1F1F23]' : 'bg-white'}>Member</option>
                      </select>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
