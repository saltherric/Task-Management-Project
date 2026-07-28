import React, { useState, useEffect } from 'react';
import { X, Users, Info, Globe, Lock, Archive, Trash2, ChevronLeft, Edit2, RotateCcw, Loader2 } from 'lucide-react';
import useAutoSave from '../../hooks/useAutoSave';
import { updateProject } from '../../services/projectApi';
import { getArchivedTasksByProject, unArchiveTask, deleteTask } from '../../services/taskApi';
import getColumnDotProps from '../../helpers/getDotColors';
import { useAlert } from '../../contexts/AlertContext';
import ConfirmDeleteTaskModal from '../taskModal/ConfirmDeleteTaskModal';

export default function MenuModal({
    isOpen,
    onClose,
    project,
    isDark,
    workspaceMembersCount,
    onManageMembers,
    onChangeVisibility,
    onViewArchived,
    onCopyBoard,
    onDeleteProject,
    onProjectUpdated
}) {
    if (!isOpen || !project) return null;

    const [currentView, setCurrentView] = useState('menu'); // 'menu', 'about', or 'archived'

    // About Project Fields Local State
    const [name, setName] = useState(project.name || '');
    const [description, setDescription] = useState(project.description || '');

    // Track manual edits to prevent auto-saving on initial render/project switch
    const [isNameDirty, setIsNameDirty] = useState(false);
    const [isDescDirty, setIsDescDirty] = useState(false);

    const [isEditingName, setIsEditingName] = useState(false);
    const [saveStatus, setSaveStatus] = useState('saved'); // 'saved', 'saving', 'error'
    const [errorMsg, setErrorMsg] = useState('');
    const { showAlert } = useAlert();

    // Archived Tasks State
    const [archivedTasks, setArchivedTasks] = useState([]);
    const [loadingArchived, setLoadingArchived] = useState(false);
    const [taskToDelete, setTaskToDelete] = useState(null);
    const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
    const [isDeletingTask, setIsDeletingTask] = useState(false);

    const fetchArchivedTasks = async () => {
        setLoadingArchived(true);
        try {
            const data = await getArchivedTasksByProject(project._id);
            setArchivedTasks(data.tasks || []);
        } catch (error) {
            console.error("Failed to fetch archived tasks:", error);
        } finally {
            setLoadingArchived(false);
        }
    };

    useEffect(() => {
        if (currentView === 'archived') {
            fetchArchivedTasks();
        }
    }, [currentView, project._id]);

    const handleRestoreTask = async (taskId) => {
        try {
            await unArchiveTask(taskId);
            setArchivedTasks(prev => prev.filter(t => t._id !== taskId));
            showAlert('Task restored successfully.', 'success');
        } catch (error) {
            console.error("Failed to unarchive task:", error);
            showAlert(error.response?.data?.message || "Failed to unarchive task.", 'error');
        }
    };

    const handleDeleteTask = (task) => {
        setTaskToDelete(task);
        setIsDeleteConfirmOpen(true);
    };

    const handleConfirmDeleteTask = async () => {
        if (!taskToDelete) return;
        try {
            setIsDeletingTask(true);
            await deleteTask(taskToDelete._id);
            setArchivedTasks(prev => prev.filter(t => t._id !== taskToDelete._id));
            setIsDeleteConfirmOpen(false);
            setTaskToDelete(null);
            showAlert('Task deleted permanently.', 'success');
        } catch (error) {
            console.error("Failed to delete task:", error);
            showAlert(error.response?.data?.message || "Failed to delete task.", 'error');
        } finally {
            setIsDeletingTask(false);
        }
    };

    // Sync state with project details when project or view changes
    useEffect(() => {
        setName(project.name || '');
        setDescription(project.description || '');
        setIsNameDirty(false);
        setIsDescDirty(false);
        setIsEditingName(false);
        setSaveStatus('saved');
        setErrorMsg('');
        setTaskToDelete(null);
        setIsDeleteConfirmOpen(false);
        setIsDeletingTask(false);
    }, [project, isOpen, currentView]);

    const saveProjectUpdates = async (updates) => {
        try {
            setSaveStatus('saving');
            setErrorMsg('');
            const data = await updateProject(project._id, updates);
            if (data.success && onProjectUpdated) {
                onProjectUpdated(data.project);
            }
            setSaveStatus('saved');
        } catch (err) {
            console.error('Failed to auto-save project updates:', err);
            setSaveStatus('error');
            const errorText = err.response?.data?.message || 'Failed to auto-save changes.';
            setErrorMsg(errorText);
            showAlert(errorText, 'error');
        }
    };

    // Setup auto-save triggers using useAutoSave hook
    useAutoSave(name, () => {
        if (!isNameDirty) return;
        if (!name.trim()) {
            setErrorMsg('Project name cannot be empty');
            setSaveStatus('error');
            return;
        }
        saveProjectUpdates({ name: name.trim() });
        setIsNameDirty(false);
    }, 1000);

    useAutoSave(description, () => {
        if (!isDescDirty) return;
        saveProjectUpdates({ description });
        setIsDescDirty(false);
    }, 1000);

    const memberCount = project.visibility === 'workspace'
        ? (workspaceMembersCount || 1)
        : (project.members?.length || 0) + 1;
    const visibility = project.visibility || "workspace";

    const handleNameChange = (e) => {
        setName(e.target.value);
        setIsNameDirty(true);
    };

    const handleDescriptionChange = (e) => {
        setDescription(e.target.value);
        setIsDescDirty(true);
    };

    const handleNameKeyDown = (e) => {
        if (e.key === 'Enter') {
            setIsEditingName(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 bg-black/15 backdrop-blur-[2px] flex justify-end animate-fade-in">
            {/* Backdrop click to close */}
            <div className="absolute inset-0" onClick={onClose} />

            {/* Drawer Panel */}
            {/* Drawer Panel */}
            <div
                className={`w-full max-w-[340px] h-full shadow-2xl flex flex-col border-l relative z-10 transition-all duration-300 translate-x-0 ${isDark
                        ? 'bg-[#12141A] border-slate-800/80 text-slate-100'
                        : 'bg-white border-slate-200 text-slate-800'
                    }`}
            >
                {/* VIEW 1: MAIN MENU */}
                {currentView === 'menu' && (
                    <>
                        {/* Header */}
                        <div className={`flex items-center gap-3 px-5 py-4 border-b shrink-0 ${isDark ? 'border-slate-800/60 bg-slate-900/10' : 'border-slate-100 bg-slate-50/50'
                            }`}>
                            <button
                                onClick={onClose}
                                className={`p-1.5 rounded-xl transition-all hover:bg-slate-150/40 dark:hover:bg-slate-800/50 cursor-pointer ${isDark ? 'text-slate-400 hover:text-white' : 'text-slate-400 hover:text-slate-750'
                                    }`}
                                aria-label="Close menu"
                            >
                                <X className="w-4 h-4" />
                            </button>
                            <h2 className="text-sm font-bold tracking-tight">Menu</h2>
                        </div>

                        {/* Content list */}
                        <div className="flex-1 overflow-y-auto py-3 divide-y divide-slate-800/10 dark:divide-slate-850/50">

                            {/* Members */}
                            <div className="px-3 py-2">
                                <button
                                    onClick={onManageMembers}
                                    className={`w-full flex items-center justify-between p-3 rounded-xl transition-all duration-200 text-left cursor-pointer ${isDark
                                            ? 'hover:bg-white/[0.04] text-slate-350 hover:text-white'
                                            : 'hover:bg-slate-50 text-slate-700 hover:text-slate-900 border border-transparent hover:border-slate-200/60 shadow-xs'
                                        }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <Users className={`w-4 h-4 ${isDark ? 'text-slate-450' : 'text-slate-550'}`} />
                                        <span className="text-xs font-semibold">Members</span>
                                    </div>
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${isDark ? 'bg-slate-900 border border-slate-800 text-slate-450' : 'bg-slate-100 text-slate-650'
                                        }`}>
                                        {memberCount}
                                    </span>
                                </button>
                            </div>

                            {/* About this board/project */} 
                            <div className="px-3 py-2">
                                <button
                                    onClick={() => setCurrentView('about')}
                                    className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all duration-200 text-left cursor-pointer ${isDark
                                            ? 'hover:bg-white/[0.04] text-slate-350 hover:text-white'
                                            : 'hover:bg-slate-50 text-slate-700 hover:text-slate-900 border border-transparent hover:border-slate-200/60 shadow-xs'
                                        }`}
                                >
                                    <Info className={`w-4 h-4 shrink-0 mt-0.5 ${isDark ? 'text-slate-450' : 'text-slate-550'}`} />
                                    <div className="min-w-0 flex-1">
                                        <h4 className="text-xs font-semibold">About this Project</h4>
                                        <p className={`text-[10px] truncate mt-0.5 ${isDark ? 'text-slate-500' : 'text-slate-500'
                                            }`}>
                                            {description}
                                        </p>
                                    </div>
                                </button>
                            </div>

                            {/* Visibility */}
                            <div className="px-3 py-3">
                                <div className="flex gap-3 p-3 items-start">
                                    <div className="mt-0.5">
                                        {visibility === 'private' ? (
                                            <Lock className={`w-4 h-4 ${isDark ? 'text-amber-500' : 'text-amber-600'}`} />
                                        ) : (
                                            <Globe className={`w-4 h-4 ${isDark ? 'text-slate-450' : 'text-slate-550'}`} />
                                        )}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <h4 className="text-xs font-semibold">Visibility</h4>

                                        {/* Styled Dropdown Selector */}
                                        <div className="mt-2.5">
                                            <select
                                                value={visibility}
                                                onChange={(e) => onChangeVisibility(e.target.value)}
                                                className={`w-full max-w-[180px] h-9 rounded-xl border text-xs font-bold px-3 focus:outline-none cursor-pointer transition-all focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/10 ${isDark
                                                        ? 'border-slate-800/80 bg-slate-900/40 text-slate-200 focus:bg-[#12141A]'
                                                        : 'border-slate-200 bg-slate-50/50 text-slate-700 focus:bg-white'
                                                    }`}
                                            >
                                                <option value="workspace" className={isDark ? 'bg-[#12141A]' : 'bg-white'}>
                                                    🌐 Workspace
                                                </option>
                                                <option value="private" className={isDark ? 'bg-[#12141A]' : 'bg-white'}>
                                                    🔒 Private
                                                </option>
                                            </select>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Archived Items */}
                            <div className="px-3 py-2">
                                <button
                                    onClick={() => setCurrentView('archived')}
                                    className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all duration-200 text-left cursor-pointer ${isDark
                                            ? 'hover:bg-white/[0.04] text-slate-350 hover:text-white'
                                            : 'hover:bg-slate-50 text-slate-700 hover:text-slate-900 border border-transparent hover:border-slate-200/60 shadow-xs'
                                        }`}
                                >
                                    <Archive className={`w-4 h-4 ${isDark ? 'text-slate-450' : 'text-slate-550'}`} />
                                    <span className="text-xs font-semibold">Archived items</span>
                                </button>
                            </div>


                            {/* Delete Project */}
                            <div className="px-3 py-2">
                                <button
                                    onClick={onDeleteProject}
                                    className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all duration-200 text-left cursor-pointer ${isDark
                                            ? 'hover:bg-rose-500/10 text-rose-400 hover:text-rose-350'
                                            : 'hover:bg-rose-50 border border-transparent hover:border-rose-100 text-rose-600'
                                        }`}
                                >
                                    <Trash2 className="w-4 h-4 shrink-0" />
                                    <span className="text-xs font-bold">Delete project</span>
                                </button>
                            </div>

                        </div>
                    </>
                )}

                {/* VIEW 2: ABOUT THIS PROJECT (DETAILS & EDITING) */}
                {currentView === 'about' && (
                    <>
                        {/* Header */}
                        <div className={`flex items-center justify-between px-4 py-4 border-b shrink-0 ${isDark ? 'border-slate-800/60 bg-slate-900/10' : 'border-slate-100 bg-slate-50/50'
                            }`}>
                            <div className="flex items-center gap-1">
                                <button
                                    onClick={() => setCurrentView('menu')}
                                    className={`p-1.5 rounded-xl transition-all hover:bg-slate-150/40 dark:hover:bg-slate-800/50 cursor-pointer ${isDark ? 'text-slate-400 hover:text-white' : 'text-slate-400 hover:text-slate-750'
                                        }`}
                                    aria-label="Back to main menu"
                                >
                                    <ChevronLeft className="w-4 h-4" />
                                </button>
                                <h2 className="text-sm font-bold tracking-tight">About this project</h2>
                            </div>
                            <button
                                onClick={onClose}
                                className={`p-1.5 rounded-xl transition-all hover:bg-slate-150/40 dark:hover:bg-slate-800/50 cursor-pointer ${isDark ? 'text-slate-400 hover:text-white' : 'text-slate-400 hover:text-slate-750'
                                    }`}
                                aria-label="Close menu"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Content Body */}
                        <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-6">

                            {/* BOARD NAME SECTION */}
                            <div className="flex flex-col gap-2">
                                <label className={`text-[10px] font-bold tracking-wider uppercase ${isDark ? 'text-slate-500' : 'text-slate-450'
                                    }`}>
                                    Board Name
                                </label>

                                {isEditingName ? (
                                    <input
                                        type="text"
                                        value={name}
                                        onChange={handleNameChange}
                                        onBlur={() => setIsEditingName(false)}
                                        onKeyDown={handleNameKeyDown}
                                        autoFocus
                                        className={`w-full h-9 rounded-xl border text-sm font-bold px-3 transition-all focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/10 focus:outline-none ${isDark
                                                ? 'border-slate-800 bg-slate-900/40 text-slate-100'
                                                : 'border-slate-200 bg-slate-50/50 text-slate-800'
                                            }`}
                                    />
                                ) : (
                                    <div className="flex items-center gap-2 group">
                                        <span
                                            onClick={() => setIsEditingName(true)}
                                            className="text-sm font-bold cursor-pointer hover:underline"
                                        >
                                            {name || "Untitled Project"}
                                        </span>
                                        <button
                                            onClick={() => setIsEditingName(true)}
                                            className={`p-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer ${isDark ? 'text-slate-400 hover:text-white hover:bg-slate-800/50' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-150/40'
                                                }`}
                                            title="Edit project name"
                                        >
                                            <Edit2 className="w-3 h-3" />
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Divider */}
                            <div className={`h-px w-full ${isDark ? 'bg-slate-800/40' : 'bg-slate-100'}`} />

                            {/* DESCRIPTION SECTION */}
                            <div className="flex flex-col gap-2">
                                <label className={`text-[10px] font-bold tracking-wider uppercase ${isDark ? 'text-slate-500' : 'text-slate-450'
                                    }`}>
                                    Description
                                </label>

                                <textarea
                                    value={description}
                                    onChange={handleDescriptionChange}
                                    placeholder="Add a description to your project..."
                                    rows={6}
                                    className={`w-full p-3.5 rounded-xl border text-xs leading-normal resize-none transition-all focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/10 focus:outline-none ${isDark
                                            ? 'bg-slate-900/40 border-slate-800/80 text-slate-350 focus:bg-slate-900/60'
                                            : 'bg-slate-50/50 border-slate-200 text-slate-650 focus:bg-white'
                                        } border-dashed focus:border-solid`}
                                />
                            </div>

                            {/* Status and feedback indicators */}
                            <div className="mt-auto pt-4 flex flex-col gap-1.5">
                                {saveStatus === 'saving' && (
                                    <span className="text-[11px] font-semibold text-indigo-400 animate-pulse flex items-center gap-1.5">
                                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-ping" />
                                        Saving changes...
                                    </span>
                                )}
                                {saveStatus === 'saved' && !isNameDirty && !isDescDirty && (
                                    <span className="text-[11px] font-semibold text-emerald-500 flex items-center gap-1.5">
                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                        All changes saved
                                    </span>
                                )}
                                {errorMsg && (
                                    <span className="text-[11px] font-bold text-red-500 flex items-center gap-1.5">
                                        <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                                        {errorMsg}
                                    </span>
                                )}
                            </div>

                        </div>
                    </>
                )}

                {/* VIEW 3: ARCHIVED ITEMS */}
                {currentView === 'archived' && (
                    <>
                        {/* Header */}
                        <div className={`flex items-center justify-between px-4 py-4 border-b shrink-0 ${
                            isDark ? 'border-slate-800/60 bg-slate-900/10' : 'border-slate-100 bg-slate-50/50'
                        }`}>
                            <div className="flex items-center gap-1">
                                <button
                                    onClick={() => setCurrentView('menu')}
                                    className={`p-1.5 rounded-xl transition-all hover:bg-slate-150/40 dark:hover:bg-slate-800/50 cursor-pointer ${
                                        isDark ? 'text-slate-400 hover:text-white' : 'text-slate-400 hover:text-slate-750'
                                    }`}
                                    aria-label="Back to main menu"
                                >
                                    <ChevronLeft className="w-4 h-4" />
                                </button>
                                <h2 className="text-sm font-bold tracking-tight">Archived Items</h2>
                            </div>
                            <button
                                onClick={onClose}
                                className={`p-1.5 rounded-xl transition-all hover:bg-slate-150/40 dark:hover:bg-slate-800/50 cursor-pointer ${
                                    isDark ? 'text-slate-400 hover:text-white' : 'text-slate-400 hover:text-slate-750'
                                }`}
                                aria-label="Close menu"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Content Body */}
                        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
                            {loadingArchived ? (
                                <div className="flex flex-col items-center justify-center py-20 gap-3">
                                    <Loader2 className="w-6 h-6 text-indigo-500 animate-spin" />
                                    <p className={`text-xs ${isDark ? 'text-slate-450' : 'text-slate-500'}`}>Loading archived items...</p>
                                </div>
                            ) : archivedTasks.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-20 text-center gap-2">
                                    <Archive className={`w-8 h-8 ${isDark ? 'text-slate-700' : 'text-slate-300'}`} />
                                    <p className={`text-xs font-bold ${isDark ? 'text-slate-400' : 'text-slate-800'}`}>No archived items</p>
                                    <p className={`text-[10px] max-w-[200px] leading-relaxed ${isDark ? 'text-slate-555' : 'text-slate-500'}`}>
                                        Tasks you archive will show up here. You can restore or delete them permanently.
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {archivedTasks.map((task) => (
                                        <div
                                            key={task._id}
                                            className={`p-3 rounded-xl border flex flex-col gap-2.5 transition-all ${
                                                isDark 
                                                    ? 'bg-slate-900/40 border-slate-800/80 text-white hover:border-slate-800' 
                                                    : 'bg-slate-50/40 border-slate-200 text-slate-800 hover:border-slate-300'
                                            }`}
                                        >
                                            <div className="flex items-start justify-between gap-3">
                                                <h4 className="text-xs font-bold leading-normal truncate flex-1">
                                                    {task.title}
                                                </h4>
                                                <span className={`text-[9px] font-bold px-2.5 py-1 rounded-full uppercase shrink-0 flex items-center gap-1.5 ${
                                                    isDark ? 'bg-slate-950/80 text-slate-400 border border-slate-800' : 'bg-slate-200/40 text-slate-650'
                                                }`}>
                                                    {task.column && (() => {
                                                        const dotProps = getColumnDotProps(task.column);
                                                        return (
                                                            <span
                                                                className={`w-1.5 h-1.5 rounded-full ${dotProps.className}`}
                                                                style={dotProps.style}
                                                            />
                                                        );
                                                    })()}
                                                    {task.column?.name || 'Task'}
                                                </span>
                                            </div>

                                            <div className="flex items-center justify-between gap-2 border-t pt-2 dark:border-slate-800/50 border-slate-100">
                                                <span className={`text-[9px] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                                                    {task.archivedAt ? `Archived ${new Date(task.archivedAt).toLocaleDateString()}` : 'Archived'}
                                                </span>

                                                <div className="flex items-center gap-1.5">
                                                    <button
                                                        onClick={() => handleRestoreTask(task._id)}
                                                        className={`p-1.5 rounded-lg transition-all hover:scale-105 flex items-center gap-1 cursor-pointer text-[10px] font-semibold ${
                                                            isDark 
                                                                ? 'bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-400' 
                                                                : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-600'
                                                        }`}
                                                        title="Send to board"
                                                    >
                                                        <RotateCcw className="w-3 h-3" />
                                                        <span>Restore</span>
                                                    </button>
                                                    <button
                                                         onClick={() => { setTaskToDelete(task); setIsDeleteConfirmOpen(true); }}
                                                         className={`p-1.5 rounded-lg transition-all hover:scale-105 flex items-center gap-1 cursor-pointer text-[10px] font-semibold ${
                                                             isDark 
                                                                 ? 'bg-rose-600/10 hover:bg-rose-600/20 text-rose-450' 
                                                                 : 'bg-rose-50 hover:bg-rose-100 text-rose-600'
                                                         }`}
                                                         title="Delete permanently"
                                                     >
                                                         <Trash2 className="w-3.5 h-3.5" />
                                                     </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>
            
            <ConfirmDeleteTaskModal
                isOpen={isDeleteConfirmOpen}
                onClose={() => {
                    setIsDeleteConfirmOpen(false);
                    setTaskToDelete(null);
                }}
                onConfirm={handleConfirmDeleteTask}
                taskTitle={taskToDelete?.title || ''}
                isDark={isDark}
                isDeleting={isDeletingTask}
            />
        </div>
    );
}
