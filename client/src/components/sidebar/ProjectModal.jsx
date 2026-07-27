import React, { useState, useContext } from 'react'
import { ThemeContext } from '../../contexts/ThemeContext'

export default function ProjectModal({ isOpen, onClose, onCreate}) {
    const { theme } = useContext(ThemeContext);
    const isDark = theme === 'dark';

    const [formData, setFormData] = useState({
        name: "",
        description: "",
        visibility: "workspace",
    });

    const handleSubmit = (e) => {
      e.preventDefault();
      onCreate(formData);
      setFormData({
          name: "",
          description: "",
          visibility: ""
      });
    };

    if (!isOpen) return null;

    return (
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/15 backdrop-blur-[2px]'>
            <div className={`w-[calc(100%-2rem)] max-w-md rounded-2xl border shadow-2xl transition-all duration-300 ${
                isDark ? 'bg-[#12141A] border-slate-800/80 text-white' : 'bg-white border-slate-200 text-slate-800'
            }`}>
                <div className={`flex items-center justify-between p-5 border-b ${
                    isDark ? 'border-slate-800/60' : 'border-slate-100'
                }`}>
                    <div className="flex items-center gap-2">
                        <i className='fa-solid fa-folder text-indigo-500 dark:text-indigo-400 text-s'></i>
                        <h2 className={`font-bold text-sm tracking-tight ${isDark ? 'text-white' : 'text-slate-800'}`}>
                            Create Project
                        </h2>
                    </div>

                    <button
                        onClick={onClose}
                        className={`p-1.5 rounded-xl transition-all hover:bg-slate-150/40 dark:hover:bg-slate-800/50 cursor-pointer ${
                            isDark ? 'text-slate-400 hover:text-white' : 'text-slate-400 hover:text-slate-700'
                        }`}
                        aria-label="Close"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <form 
                    onSubmit={handleSubmit}
                    className='p-5 space-y-4'
                >
                    <div>
                        <label className={`block text-[10px] font-bold uppercase tracking-wider mb-2 ${isDark ? 'text-slate-500' : 'text-slate-450'}`}>
                            Title <span className='text-rose-500'>*</span>
                        </label>
                        <input 
                            type="text" 
                            value={formData.name} 
                            onChange={(e) => 
                                setFormData((prev) => ({
                                    ...prev,
                                    name: e.target.value,
                                }))
                            }
                            placeholder="Enter project title"
                            className={`w-full border rounded-xl px-3.5 py-2 text-sm transition-all focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/10 focus:outline-none ${
                                isDark 
                                    ? 'bg-slate-900/40 border-slate-800/80 text-white placeholder-slate-600' 
                                    : 'bg-slate-50/50 border-slate-200 text-slate-800 placeholder-slate-400'
                            }`} 
                            required
                        />
                    </div>

                    <div>
                        <label className={`block text-[10px] font-bold uppercase tracking-wider mb-2 ${isDark ? 'text-slate-500' : 'text-slate-450'}`}>
                            Description
                        </label>
                        <textarea 
                            rows={4} 
                            value={formData.description} 
                            onChange={(e) => 
                                setFormData((prev) => ({
                                    ...prev,
                                    description: e.target.value,
                                }))
                            }
                            placeholder="Describe the project goal"
                            className={`w-full border rounded-xl px-3.5 py-2 text-sm transition-all focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/10 focus:outline-none ${
                                isDark 
                                    ? 'bg-slate-900/40 border-slate-800/80 text-white placeholder-slate-600' 
                                    : 'bg-slate-50/50 border-slate-200 text-slate-800 placeholder-slate-400'
                            }`}
                        />
                    </div>

                    <div>
                        <label className={`block text-[10px] font-bold uppercase tracking-wider mb-3 ${isDark ? 'text-slate-500' : 'text-slate-450'}`}>
                            Visibility
                        </label>

                        <div className="grid grid-cols-2 gap-3">
                            <label
                                className={`cursor-pointer rounded-xl border p-3 transition-all ${
                                    formData.visibility === "private"
                                        ? "border-indigo-500 bg-indigo-500/10"
                                        : isDark ? "border-slate-800 hover:border-slate-700 bg-slate-900/20" : "border-slate-200 hover:border-slate-300 bg-slate-50/40"
                                }`}
                            >
                                <input
                                    type="radio"
                                    name="visibility"
                                    value="private"
                                    checked={formData.visibility === "private"}
                                    onChange={(e) =>
                                        setFormData((prev) => ({
                                            ...prev,
                                            visibility: e.target.value,
                                        }))
                                    }
                                    className="hidden"
                                />

                                <div>
                                    <p className={`text-xs font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>
                                        Private
                                    </p>
                                    <p className={`text-[10px] mt-1 ${isDark ? 'text-slate-550' : 'text-slate-450'}`}>
                                        Only invited members can access.
                                    </p>
                                </div>
                            </label>

                            <label
                                className={`cursor-pointer rounded-xl border p-3 transition-all ${
                                    formData.visibility === "workspace"
                                        ? "border-indigo-500 bg-indigo-500/10"
                                        : isDark ? "border-slate-800 hover:border-slate-700 bg-slate-900/20" : "border-slate-200 hover:border-slate-300 bg-slate-50/40"
                                }`}
                            >
                                <input
                                    type="radio"
                                    name="visibility"
                                    value="workspace"
                                    checked={formData.visibility === "workspace"}
                                    onChange={(e) =>
                                        setFormData((prev) => ({
                                            ...prev,
                                            visibility: e.target.value,
                                        }))
                                    }
                                    className="hidden"
                                />

                                <div>
                                    <p className={`text-xs font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>
                                        Workspace
                                    </p>
                                    <p className={`text-[10px] mt-1 ${isDark ? 'text-slate-550' : 'text-slate-450'}`}>
                                        Visible to all workspace members.
                                    </p>
                                </div>
                            </label>
                        </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className={`px-4 py-2 rounded-xl text-xs font-semibold border transition-all duration-200 cursor-pointer ${
                                isDark 
                                    ? 'bg-slate-900/40 hover:bg-slate-800/40 border-slate-800 text-slate-300' 
                                    : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-600'
                            }`}
                        >
                            Cancel
                        </button>

                        <button
                            type="submit"
                            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-lg shadow-indigo-600/15 hover:shadow-indigo-600/25 transition-all duration-200 cursor-pointer"
                        >
                            Create
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}