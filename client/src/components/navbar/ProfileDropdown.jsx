function ProfileDropdown({
  currentUser,
  profileInitials,
  isDark,
  handleLogout,
}) {
  return (
    <div
      className={`absolute right-0 mt-3.5 w-64 origin-top-right rounded-2xl p-2 shadow-xl  ring-black ring-opacity-5 focus:outline-none z-50 ${
        isDark
          ? "border-slate-900 bg-slate-950"
          : "border-slate-100 bg-white"
      }`}
    >
      <div
        className={`flex items-center gap-3 border-b px-3 py-2 ${
          isDark ? "border-slate-900" : "border-slate-100"
        }`}
      >
        <div className="h-13 w-13 rounded-full bg-linear-to-tr from-violet-600 to-indigo-600 text-white font-semibold text-base flex items-center justify-center">
          {profileInitials}
        </div>

        <div className="min-w-0 !space-y-1 !pt-3">
          <p
            className={`text-lg font-medium truncate ${
              isDark ? "text-slate-100" : "text-slate-800"
            }`}
          >
            {currentUser?.name || "Guest User"}
          </p>

          <p
            className={`text-[14px] truncate ${
              isDark ? "text-slate-500" : "text-slate-400"
            }`}
          >
            {currentUser?.email || "No email available"}
          </p>
        </div>
      </div>

      {/* menu items go here */}
      <div className="mt-1.5 space-y-0.5">
        <button className={`w-full text-left flex items-center gap-2.5 px-3 py-2 rounded-xl !text-[14px] font-normal transition-all duration-150 ${isDark ? 'text-slate-300 hover:bg-slate-900/60' : 'text-slate-600 hover:bg-slate-50'}`}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
            My Settings
        </button>
        <button className={`w-full text-left flex items-center gap-2.5 px-3 py-2 rounded-xl !text-[14px] font-normal transition-all duration-150 ${isDark ? 'text-slate-300 hover:bg-slate-900/60' : 'text-slate-600 hover:bg-slate-50'}`}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path></svg>
            Workspace Admin
        </button>
        <div className={`border-t my-1 ${isDark ? 'border-slate-900' : 'border-slate-100'}`}></div>
        <button 
            className={`w-full text-left flex items-center gap-2.5 px-3 py-2 rounded-xl !text-[14px] font-normal transition-all duration-150 ${isDark ? 'text-rose-400 hover:bg-rose-950/30' : 'text-rose-600 hover:bg-rose-50'}`}
            onClick={handleLogout}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>
          Sign out
        </button>
      </div>
    </div>
  );
}

export {ProfileDropdown};