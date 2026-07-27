import React, { useState, useEffect } from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';

export default function ConfirmDeleteModal({ isOpen, onClose, onConfirm, projectName, isDark, isDeleting }) {
    const [typedConfirm, setTypedConfirm] = useState('');

    useEffect(() => {
        if (!isOpen) {
            setTypedConfirm('');
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const isMatch = typedConfirm.trim().toLowerCase() === projectName?.trim().toLowerCase();

    const handleConfirm = () => {
        if (isMatch) {
            onConfirm();
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-[3px] transition-all duration-300">
            <div className={`w-[calc(100%-2rem)] max-w-md rounded-2xl border shadow-2xl overflow-hidden transition-all duration-300 transform scale-100 ${
                isDark 
                    ? 'bg-[#12141A] border-slate-800/80 text-white' 
                    : 'bg-white border-slate-200 text-slate-800'
            }`}>
                {/* Header */}
                <div className={`flex items-center justify-between p-5 border-b ${
                    isDark ? 'border-slate-800/60' : 'border-slate-100'
                }`}>
                    <div className="flex items-center gap-2 text-rose-500">
                        <AlertTriangle className="w-5 h-5 shrink-0" />
                        <h2 className="font-bold text-sm tracking-tight">Delete Project</h2>
                    </div>
                    <button
                        onClick={onClose}
                        disabled={isDeleting}
                        className={`p-1.5 rounded-xl transition-all hover:bg-slate-150/40 dark:hover:bg-slate-800/50 cursor-pointer ${
                            isDark ? 'text-slate-400 hover:text-white' : 'text-slate-450 hover:text-slate-700'
                        }`}
                        aria-label="Close"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-5 space-y-4">
                    <p className={`text-xs leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-650'}`}>
                        Are you sure you want to delete <span className="font-bold text-rose-550">"{projectName}"</span>? This will permanently delete:
                    </p>
                    
                    <ul className={`text-[11px] list-disc list-inside space-y-1 pl-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                        <li>All columns and lists</li>
                        <li>All tasks and subtasks</li>
                        <li>All comments, reactions, and history</li>
                        <li>All uploaded files and attachments (permanent S3 removal)</li>
                    </ul>

                    <div className={`p-3 rounded-xl border text-[11px] leading-relaxed ${
                        isDark 
                            ? 'bg-rose-950/15 border-rose-900/30 text-rose-300' 
                            : 'bg-rose-50 border-rose-100 text-rose-700'
                    }`}>
                        <strong>Warning:</strong> This action is irreversible. All data will be permanently wiped.
                    </div>

                    <div className="space-y-2">
                        <label className={`block text-[10px] font-bold uppercase tracking-wider ${
                            isDark ? 'text-slate-500' : 'text-slate-450'
                        }`}>
                            Type <span className="font-extrabold text-rose-500">"{projectName}"</span> to confirm
                        </label>
                        <input
                            type="text"
                            value={typedConfirm}
                            onChange={(e) => setTypedConfirm(e.target.value)}
                            disabled={isDeleting}
                            placeholder={projectName}
                            className={`w-full h-10 rounded-xl border text-xs px-3 focus:outline-none focus:ring-2 focus:ring-rose-500/25 transition-all ${
                                isDark
                                    ? 'border-slate-800 bg-slate-900/40 text-slate-200 focus:border-rose-500/50'
                                    : 'border-slate-200 bg-slate-50 text-slate-800 focus:border-rose-500/50'
                            }`}
                        />
                    </div>
                </div>

                {/* Footer */}
                <div className={`flex gap-3 p-5 border-t justify-end ${
                    isDark ? 'border-slate-800/60' : 'border-slate-100'
                }`}>
                    <button
                        onClick={onClose}
                        disabled={isDeleting}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border shrink-0 cursor-pointer disabled:opacity-50 ${
                            isDark 
                                ? 'border-slate-850 bg-slate-900/30 text-slate-350 hover:bg-slate-850 hover:text-white' 
                                : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                        }`}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleConfirm}
                        disabled={!isMatch || isDeleting}
                        className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white transition-all shrink-0 cursor-pointer shadow-md ${
                            isMatch && !isDeleting
                                ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-600/10 hover:shadow-rose-600/25'
                                : 'bg-slate-300 dark:bg-slate-800 text-slate-500 dark:text-slate-500 cursor-not-allowed opacity-50 shadow-none'
                        }`}
                    >
                        <Trash2 className="w-3.5 h-3.5" />
                        {isDeleting ? 'Deleting...' : 'Delete Project'}
                    </button>
                </div>
            </div>
        </div>
    );
}
