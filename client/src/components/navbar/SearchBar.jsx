import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { searchTasks } from '../../services/taskApi';

function SearchBar({
  searchRef,
  searchQuery,
  setSearchQuery,
  isSearchFocused,
  setIsSearchFocused,
  isDark,
}) {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setTasks([]);
      return;
    }

    const delayDebounceId = setTimeout(async () => {
      setIsLoading(true);
      try {
        const response = await searchTasks(searchQuery);
        if (response?.success) {
          setTasks(response.tasks || []);
        }
      } catch (error) {
        console.error("Search failed:", error);
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounceId);
  }, [searchQuery]);

  const handleTaskClick = (task) => {
    setIsSearchFocused(false);
    setSearchQuery('');
    
    const workspaceId = task.project?.workspace?._id || task.project?.workspace;
    const projectId = task.project?._id;
    
    if (workspaceId && projectId) {
      navigate(`/workspaces/${workspaceId}/projects/${projectId}`, {
        state: { openTaskId: task._id }
      });
    }
  };

  const getPriorityStyles = (priority) => {
    const prio = priority?.toLowerCase();
    if (isDark) {
      switch (prio) {
        case "high": return "bg-rose-950/40 text-rose-400 border border-rose-900/30";
        case "medium": return "bg-amber-950/40 text-amber-400 border border-amber-900/30";
        case "low": return "bg-emerald-950/40 text-emerald-400 border border-emerald-900/30";
        default: return "bg-slate-950/40 text-slate-400 border border-slate-800";
      }
    } else {
      switch (prio) {
        case "high": return "bg-rose-50 text-rose-600 border border-rose-200/50";
        case "medium": return "bg-amber-50 text-amber-600 border border-amber-200/50";
        case "low": return "bg-emerald-50 text-emerald-600 border border-emerald-200/50";
        default: return "bg-slate-100 text-slate-600 border border-slate-200";
      }
    }
  };

  const getStatusStyles = (status) => {
    const s = status?.toLowerCase();
    if (isDark) {
      switch (s) {
        case "done": return "bg-emerald-950/30 text-emerald-400";
        case "review": return "bg-purple-950/30 text-purple-400";
        case "inprogress": return "bg-blue-950/30 text-blue-400";
        default: return "bg-slate-800 text-slate-400";
      }
    } else {
      switch (s) {
        case "done": return "bg-emerald-50 text-emerald-700";
        case "review": return "bg-purple-50 text-purple-700";
        case "inprogress": return "bg-blue-50 text-blue-700";
        default: return "bg-slate-100 text-slate-600";
      }
    }
  };

  const getStatusLabel = (status) => {
    switch (status?.toLowerCase()) {
      case "done": return "Done";
      case "review": return "Review";
      case "inprogress": return "In Progress";
      default: return "To Do";
    }
  };

  return (
    <div ref={searchRef} className="relative hidden sm:flex flex-1 max-w-md mx-4 md:mx-8">
      {/* Search Input Container */}
      <div className="relative w-full">
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
          <svg className={`h-5 w-5 ${isDark ? 'text-slate-500' : 'text-slate-400'}`} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
        </div>
        <input
          type="text"
          className={`block w-full rounded-xl border py-2 pl-10 pr-10 text-sm focus:border-indigo-500 focus:ring-2 transition-all duration-200 outline-none ${
            isDark 
              ? 'border-slate-700/80 bg-slate-800/60 text-slate-100 placeholder-slate-500 focus:bg-slate-800 focus:ring-indigo-950/50' 
              : 'border-slate-200 bg-slate-50 text-slate-800 placeholder-slate-400 focus:bg-white focus:ring-indigo-100'
          }`}
          placeholder="Search tasks, descriptions, tags..."
          value={searchQuery}
          onFocus={() => setIsSearchFocused(true)}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        {searchQuery && (
          <button 
            className={`absolute inset-y-0 right-0 flex items-center pr-3 ${isDark ? 'text-slate-500 hover:text-slate-300' : 'text-slate-400 hover:text-slate-600'}`}
            onClick={() => setSearchQuery('')}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        )}
      </div>

      {/* Premium Dropdown list */}
      {isSearchFocused && searchQuery.trim() && (
        <div className={`absolute top-full left-0 right-0 mt-2 z-50 rounded-2xl border shadow-2xl p-3 max-h-[380px] overflow-y-auto backdrop-blur-md transition-all duration-250 animate-fade-in ${
          isDark 
            ? 'bg-slate-900/95 border-slate-800 text-slate-100 shadow-slate-950/55' 
            : 'bg-white/95 border-slate-200 text-slate-800 shadow-indigo-100/50'
        }`}>
          {isLoading ? (
            <div className="flex items-center justify-center py-8 gap-2">
              <svg className="animate-spin h-5 w-5 text-indigo-500" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span className={`text-xs font-semibold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Searching...</span>
            </div>
          ) : tasks.length === 0 ? (
            <div className="text-center py-8">
              <p className={`text-xs font-medium ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>No tasks found matching "{searchQuery}"</p>
            </div>
          ) : (
            <div className="space-y-1.5">
              <div className={`px-2 pb-1.5 text-[10px] font-bold uppercase tracking-wider border-b ${isDark ? 'text-slate-500 border-slate-800' : 'text-slate-400 border-slate-150'}`}>
                Tasks ({tasks.length})
              </div>
              <div className="space-y-1">
                {tasks.map(task => (
                  <button
                    key={task._id}
                    onClick={() => handleTaskClick(task)}
                    className={`w-full text-left p-2.5 rounded-xl transition-all duration-150 flex flex-col gap-1.5 ${
                      isDark 
                        ? 'hover:bg-slate-800/80 focus:bg-slate-800/80 outline-none' 
                        : 'hover:bg-slate-50 focus:bg-slate-50 outline-none'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3 w-full">
                      <span className={`text-xs font-bold leading-normal transition-colors break-words ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                        {task.title}
                      </span>
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md uppercase shrink-0 ${getPriorityStyles(task.priority)}`}>
                        {task.priority || 'medium'}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[10px]">
                      {task.project?.name && (
                        <div className={`flex items-center gap-1 ${isDark ? 'text-slate-450' : 'text-slate-500'}`}>
                          <svg className="w-3 h-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"></path>
                          </svg>
                          <span className="font-semibold">{task.project.name}</span>
                        </div>
                      )}
                      
                      <span className={`w-[3px] h-[3px] rounded-full ${isDark ? 'bg-slate-700' : 'bg-slate-300'}`} />

                      <div className={`px-1.5 py-0.2 rounded-full font-bold text-[9px] uppercase ${getStatusStyles(task.status)}`}>
                        {getStatusLabel(task.status)}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export { SearchBar };