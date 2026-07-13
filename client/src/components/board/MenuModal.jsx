import React, { useState, useEffect } from 'react';
import { X, Users, Info, Globe, Lock, Archive, Copy, Trash2, ChevronLeft, Edit2 } from 'lucide-react';
import useAutoSave from '../../hooks/useAutoSave';
import { updateProject } from '../../services/projectApi';

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

    const [currentView, setCurrentView] = useState('menu'); // 'menu' or 'about'

    // About Project Fields Local State
    const [name, setName] = useState(project.name || '');
    const [description, setDescription] = useState(project.description || '');

    // Track manual edits to prevent auto-saving on initial render/project switch
    const [isNameDirty, setIsNameDirty] = useState(false);
    const [isDescDirty, setIsDescDirty] = useState(false);

    const [isEditingName, setIsEditingName] = useState(false);
    const [saveStatus, setSaveStatus] = useState('saved'); // 'saved', 'saving', 'error'
    const [errorMsg, setErrorMsg] = useState('');

    // Sync state with project details when project or view changes
    useEffect(() => {
        setName(project.name || '');
        setDescription(project.description || '');
        setIsNameDirty(false);
        setIsDescDirty(false);
        setIsEditingName(false);
        setSaveStatus('saved');
        setErrorMsg('');
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
            setErrorMsg(err.response?.data?.message || 'Failed to auto-save changes.');
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
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex justify-end animate-fade-in">
            {/* Backdrop click to close */}
            <div className="absolute inset-0" onClick={onClose} />

            {/* Drawer Panel */}
            <div
                className={`w-full max-w-[340px] h-full shadow-2xl flex flex-col border-l relative z-10 transition-all duration-300 translate-x-0 ${isDark
                        ? 'bg-[#0f172a] border-slate-800 text-slate-100'
                        : 'bg-[#f8fafc] border-slate-200 text-slate-800'
                    }`}
            >
                {/* VIEW 1: MAIN MENU */}
                {currentView === 'menu' && (
                    <>
                        {/* Header */}
                        <div className={`flex items-center gap-3 px-5 py-4 border-b shrink-0 ${isDark ? 'border-slate-800 bg-[#1e293b]/20' : 'border-slate-200 bg-white'
                            }`}>
                            <button
                                onClick={onClose}
                                className={`p-1.5 rounded-xl transition-colors focus:outline-none ${isDark ? 'hover:bg-slate-800/60 text-slate-400 hover:text-white' : 'hover:bg-slate-100 text-slate-500 hover:text-slate-800'
                                    }`}
                                aria-label="Close menu"
                            >
                                <X className="w-4.5 h-4.5" />
                            </button>
                            <h2 className="text-base font-bold tracking-tight">Menu</h2>
                        </div>

                        {/* Content list */}
                        <div className="flex-1 overflow-y-auto py-3 divide-y divide-slate-800/10 dark:divide-slate-800/40">

                            {/* Members */}
                            <div className="px-3 py-2">
                                <button
                                    onClick={onManageMembers}
                                    className={`w-full flex items-center justify-between p-3 rounded-xl transition-all duration-200 text-left ${isDark
                                            ? 'hover:bg-slate-800/40 text-slate-300 hover:text-white'
                                            : 'hover:bg-white text-slate-700 hover:text-slate-900 border border-transparent hover:border-slate-200/60 shadow-xs'
                                        }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <Users className={`w-5 h-5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`} />
                                        <span className="text-sm font-semibold">Members</span>
                                    </div>
                                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${isDark ? 'bg-slate-800 text-slate-400' : 'bg-slate-100 text-slate-600'
                                        }`}>
                                        {memberCount}
                                    </span>
                                </button>
                            </div>

                            {/* About this board/project */}
                            <div className="px-3 py-2">
                                <button
                                    onClick={() => setCurrentView('about')}
                                    className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all duration-200 text-left ${isDark
                                            ? 'hover:bg-slate-800/40 text-slate-300 hover:text-white'
                                            : 'hover:bg-white text-slate-700 hover:text-slate-900 border border-transparent hover:border-slate-200/60 shadow-xs'
                                        }`}
                                >
                                    <Info className={`w-5 h-5 shrink-0 mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`} />
                                    <div className="min-w-0 flex-1">
                                        <h4 className="text-sm font-semibold">About this Project</h4>
                                        <p className={`text-[11px] truncate mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'
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
                                            <Lock className={`w-5 h-5 ${isDark ? 'text-amber-500' : 'text-amber-600'}`} />
                                        ) : (
                                            <Globe className={`w-5 h-5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`} />
                                        )}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <h4 className="text-sm font-semibold">Visibility</h4>

                                        {/* Styled Dropdown Selector */}
                                        <div className="mt-2.5">
                                            <select
                                                value={visibility}
                                                onChange={(e) => onChangeVisibility(e.target.value)}
                                                className={`w-full max-w-[180px] h-9 rounded-lg border text-xs font-semibold px-2.5 focus:outline-none cursor-pointer transition-all ${isDark
                                                        ? 'border-slate-800 bg-[#0f172a] text-slate-200 focus:border-indigo-500'
                                                        : 'border-slate-200 bg-white text-slate-700 focus:border-indigo-650'
                                                    }`}
                                            >
                                                <option value="workspace" className={isDark ? 'bg-[#0f172a]' : 'bg-white'}>
                                                    🏢 Workspace
                                                </option>
                                                <option value="private" className={isDark ? 'bg-[#0f172a]' : 'bg-white'}>
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
                                    onClick={onViewArchived}
                                    className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all duration-200 text-left ${isDark
                                            ? 'hover:bg-slate-800/40 text-slate-300 hover:text-white'
                                            : 'hover:bg-white text-slate-700 hover:text-slate-900 border border-transparent hover:border-slate-200/60 shadow-xs'
                                        }`}
                                >
                                    <Archive className={`w-5 h-5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`} />
                                    <span className="text-sm font-semibold">Archived items</span>
                                </button>
                            </div>

                            {/* Copy Board */}
                            <div className="px-3 py-2">
                                <button
                                    onClick={onCopyBoard}
                                    className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all duration-200 text-left ${isDark
                                            ? 'hover:bg-slate-800/40 text-slate-300 hover:text-white'
                                            : 'hover:bg-white text-slate-700 hover:text-slate-900 border border-transparent hover:border-slate-200/60 shadow-xs'
                                        }`}
                                >
                                    <Copy className={`w-5 h-5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`} />
                                    <span className="text-sm font-semibold">Copy board</span>
                                </button>
                            </div>

                            {/* Delete Project */}
                            <div className="px-3 py-2">
                                <button
                                    onClick={onDeleteProject}
                                    className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all duration-200 text-left text-red-500 ${isDark ? 'hover:bg-red-500/10' : 'hover:bg-red-55'
                                        }`}
                                >
                                    <Trash2 className="w-5 h-5 shrink-0" />
                                    <span className="text-sm font-bold">Delete project</span>
                                </button>
                            </div>

                        </div>
                    </>
                )}

                {/* VIEW 2: ABOUT THIS PROJECT (DETAILS & EDITING) */}
                {currentView === 'about' && (
                    <>
                        {/* Header */}
                        <div className={`flex items-center justify-between px-4 py-4 border-b shrink-0 ${isDark ? 'border-slate-800 bg-[#1e293b]/20' : 'border-slate-200 bg-white'
                            }`}>
                            <div className="flex items-center gap-1">
                                <button
                                    onClick={() => setCurrentView('menu')}
                                    className={`p-1.5 rounded-xl transition-colors focus:outline-none ${isDark ? 'hover:bg-slate-800/60 text-slate-400 hover:text-white' : 'hover:bg-slate-100 text-slate-500 hover:text-slate-800'
                                        }`}
                                    aria-label="Back to main menu"
                                >
                                    <ChevronLeft className="w-4.5 h-4.5" />
                                </button>
                                <h2 className="text-sm font-bold tracking-tight">About this board</h2>
                            </div>
                            <button
                                onClick={onClose}
                                className={`p-1.5 rounded-xl transition-colors focus:outline-none ${isDark ? 'hover:bg-slate-800/60 text-slate-400 hover:text-white' : 'hover:bg-slate-100 text-slate-500 hover:text-slate-800'
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
                                <label className={`text-[10px] font-bold tracking-wider uppercase ${isDark ? 'text-slate-500' : 'text-slate-400'
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
                                        className={`w-full h-9 rounded-lg border text-sm font-bold px-3 focus:outline-none transition-all ${isDark
                                                ? 'border-indigo-500 bg-[#0c101b] text-slate-100'
                                                : 'border-indigo-600 bg-white text-slate-800'
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
                                            className={`p-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity ${isDark ? 'text-slate-400 hover:text-white hover:bg-slate-850' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
                                                }`}
                                            title="Edit project name"
                                        >
                                            <Edit2 className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Divider */}
                            <div className={`h-px w-full ${isDark ? 'bg-slate-850' : 'bg-slate-100'}`} />

                            {/* DESCRIPTION SECTION */}
                            <div className="flex flex-col gap-2">
                                <label className={`text-[10px] font-bold tracking-wider uppercase ${isDark ? 'text-slate-500' : 'text-slate-400'
                                    }`}>
                                    Description
                                </label>

                                <textarea
                                    value={description}
                                    onChange={handleDescriptionChange}
                                    placeholder="Add a description to your project..."
                                    rows={6}
                                    className={`w-full p-3.5 rounded-xl border text-xs leading-normal resize-none focus:outline-none transition-all ${isDark
                                            ? 'bg-[#0f172a] border-slate-800/80 text-slate-300 focus:border-indigo-500 focus:bg-[#0c101b]'
                                            : 'bg-white border-slate-200 text-slate-650 focus:border-indigo-650 focus:bg-slate-50/20'
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
            </div>
        </div>
    );
}
