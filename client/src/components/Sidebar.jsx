import React, { useContext, useState } from 'react';
import { ThemeContext } from '../context/ThemeContext';

function Sidebar() {
  const { theme } = useContext(ThemeContext);
  const isDark = theme === 'dark';
  const [activeView, setActiveView] = useState('Dashboard');
  const [projectsExpanded, setProjectsExpanded] = useState(true);

  const navItems = [
    { label: 'Dashboard', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg> },
    { label: 'Board', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" /></svg> },
    { label: 'Analytics', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M11 3.055A9.003 9.003 0 1020.945 13H11V3.055z" /><path strokeLinecap="round" strokeLinejoin="round" d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" /></svg> },
    { label: 'Activity', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> },
    { label: 'Settings', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg> },
  ];

  const projects = [
    { label: 'Mobile Redesign', accent: 'bg-emerald-500' },
    { label: 'API Migration', accent: 'bg-rose-500' },
    { label: 'Marketing Site', accent: 'bg-amber-500' },
  ];

  return (
    <aside
      className={`sidebar flex w-full flex-col overflow-hidden border-b ${
        isDark
          ? 'is-dark border-slate-800 bg-[#080d19] text-slate-100'
          : 'border-slate-200 bg-slate-50 text-slate-900'
      } lg:fixed lg:left-0 lg:top-16 lg:z-30 lg:h-[calc(100vh-4rem)] lg:w-72 lg:border-b-0 lg:border-r`}
    >
      <div className="flex-1 overflow-y-auto px-4 py-6 lg:px-6 lg:py-8">
        <div className="space-y-1">
          <div className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            Workspace
          </div>
          {navItems.map((item) => {
            const isActive = activeView === item.label;

            return (
              <button
                key={item.label}
                type="button"
                onClick={() => setActiveView(item.label)}
                className={`group relative flex w-full items-center gap-3.5 px-3 py-2.5 text-left text-sm font-semibold transition-colors ${
                  isActive
                    ? isDark
                      ? 'rounded-xl bg-[#141b2d] text-indigo-400'
                      : 'rounded-xl bg-indigo-50 text-indigo-600'
                    : isDark
                      ? 'text-slate-400 hover:text-slate-200 hover:bg-[#0f1724] rounded-lg'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200 rounded-lg'
                }`}
                aria-pressed={isActive}
              >
                {isActive && (
                  <div className="absolute -left-4 top-1/2 h-[60%] w-1.5 -translate-y-1/2 rounded-r-md bg-indigo-500/60" />
                )}
                <span className={isActive ? 'text-indigo-400' : 'text-slate-500'}>
                  {item.icon}
                </span>
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>

        <div className={`my-6 h-px w-full ${isDark ? 'bg-slate-800/60' : 'bg-slate-200/80'}`} />

        <div className="space-y-1">
          <div className="flex items-center justify-between px-3 pb-2">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              Projects
            </div>
            <button
              type="button"
              onClick={() => setProjectsExpanded((value) => !value)}
              className={`text-slate-500 transition-colors ${
                isDark ? 'hover:text-slate-300' : 'hover:text-slate-700'
              }`}
              aria-label={projectsExpanded ? 'Collapse projects' : 'Expand projects'}
            >
              <svg
                className={`h-3.5 w-3.5 transition-transform ${projectsExpanded ? '' : '-rotate-90'}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                strokeWidth="2.5"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>

          {projectsExpanded && (
            <div className="space-y-1">
              {projects.map((project) => (
                <div
                  key={project.label}
                  className={`group flex cursor-pointer items-center gap-3.5 px-3 py-2 text-sm font-semibold transition-colors ${
                    isDark
                      ? 'text-slate-300 hover:text-white hover:bg-white/2 rounded-md'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-md'
                  }`}
                >
                  <span className={`h-2 w-2 rounded-full ${project.accent} group-hover:scale-110 transition-transform`} />
                  <span>{project.label}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;