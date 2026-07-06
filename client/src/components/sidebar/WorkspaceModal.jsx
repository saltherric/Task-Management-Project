import React, { useState } from 'react'

export default function WorkspaceModal({ isOpen, onClose, onCreate}) {
    const [formData, setFormData] = useState({
        name: "",
        description: ""
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        onCreate(formData);
        setFormData({
            name: "",
            description: "",
        });
    };

    if (!isOpen) return null;

    return (
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm'>
            <div className='w-full max-w-md rounded-2xl bg-slate-900 border-slate-700 shadow-2xl'>
                <div className='flex items-center justify-between p-5 border-slate-800'>
                    <h2 className='text-white font-semibold'>
                        Create Workspace
                    </h2>

                    <button
                        onClick={onClose}
                        className='text-slate-400 hover:text-white'
                    >
                        ✕
                    </button>
                </div>

                <form 
                    onSubmit={handleSubmit}
                    className='p-5 space-y-4'
                >
                    <div>
                        <label className='block text-xs text-slate-400 mb-2'>Title <span className='text-red-600'>*</span></label>
                        <input 
                            type="text" 
                            value={formData.name} 
                            onChange={(e) => 
                                setFormData((prev) => ({
                                    ...prev,
                                    name: e.target.value,
                                }))
                            }
                            className='w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white' 
                            required
                        />
                    </div>

                    <div>
                        <label className='block text-xs text-slate-400 mb-2'> Description</label>
                        <textarea rows={4} value={formData.description} 
                            onChange={(e) => 
                                setFormData((prev) => ({
                                    ...prev,
                                    description: e.target.value,
                                }))
                            }
                            className='w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white'
                        />
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300"
                        >
                            Cancel
                        </button>

                        <button
                            type="submit"
                            className="px-4 py-2 rounded-lg bg-blue-600 text-white"
                        >
                            Create
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}