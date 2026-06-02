function SearchBar({
  searchRef,
  searchQuery,
  setSearchQuery,
  isSearchFocused,
  setIsSearchFocused,
  filteredTasks,
  getPriorityBadgeColor,
  isDark,
}) {
  return (
    <div ref={searchRef} className="relative flex-1 max-w-md mx-4 md:mx-8">
        {/* Search Input */}
        <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <svg className={`h-5 w-5 ${isDark ? 'text-slate-500' : 'text-slate-400'}`} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <circle cx="11" cy="11" r="8"></circle>
                    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                </svg>
            </div>
            <input
                type="text"
                className={`block w-full rounded-xl border py-2 pl-10 pr-10 text-sm focus:border-indigo-500 focus:ring-2 transition-all duration-200 outline-none ${isDark ? 'border-slate-700/80 bg-slate-800/60 text-slate-100 placeholder-slate-500 focus:bg-slate-800 focus:ring-indigo-950/50' : 'border-slate-200 bg-slate-50 text-slate-800 placeholder-slate-400 focus:bg-white focus:ring-indigo-100'}`}
                placeholder="Search tasks, categories..."
                value={searchQuery}
                onFocus={() => setIsSearchFocused(true)}
                onChange={(e) => setSearchQuery(e.target.value)}
            />
            {isSearchFocused && searchQuery && (
                <div>
                    <button 
                        className={`absolute inset-y-0 right-0 flex items-center pr-3 ${isDark ? 'text-slate-500 hover:text-slate-300' : 'text-slate-400 hover:text-slate-600'}`}
                        onClick={() => setSearchQuery('')}
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                    </button>

                    {filteredTasks.map(task => (
                        <div key={task._id || task.id}>
                        {task.title}
                        </div>
                    ))}
                </div>
            )}
        </div>
    </div>
  );
}

export {SearchBar} ;