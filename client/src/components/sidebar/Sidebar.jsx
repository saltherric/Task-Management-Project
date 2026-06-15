import React, { useContext, useState, useRef, useEffect } from 'react';
import { ThemeContext } from '../../contexts/ThemeContext';
import getWorkspaces from '../../services/workspaceApi';
import getProjects from '../../services/projectApi';
import { useNavigate } from "react-router-dom";
import { useParams } from "react-router-dom";

function Sidebar() {
  const { theme } = useContext(ThemeContext);
  const isDark = theme === 'dark';
  const [activeView, setActiveView] = useState('Board');
  const [projectsExpanded, setProjectsExpanded] = useState(true);
  const dropdownRef = useRef(null);
  const [workspaces, setWorkspaces] = useState([]);
  const [workspaceDropdownOpen, setWorkspaceDropdownOpen] = useState(false);
  const navigate = useNavigate();

  const { workspaceId, projectId} = useParams();
  
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setWorkspaceDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect (() => {
    fecthWorkspaces()
  }, []);

  const fecthWorkspaces = async () => {
    try {
      const data = await getWorkspaces();
      const workspaceList = data.workspaces;
      setWorkspaces(workspaceList); 
      
    } catch (error) {
      console.error("Failed to fetch workspaces: ", error);
    }
  };

  const activeWorkspace = workspaces.find(ws => ws._id === workspaceId) || { name: "Select Workspace" };

  useEffect(() => {
    if (
        workspaces.length > 0 &&
        !workspaceId
    ) {
        navigate(
          `/workspaces/${workspaces[0]._id}`
        );
    }
  }, [workspaces, workspaceId, navigate]);

  const navItems = [
    { label: 'Dashboard', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg> },
    { label: 'Board', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" /></svg> },
    { label: 'Analytics', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M11 3.055A9.003 9.003 0 1020.945 13H11V3.055z" /><path strokeLinecap="round" strokeLinejoin="round" d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" /></svg> },
    { label: 'Activity', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> },
    { label: 'Settings', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg> },
  ];

  const [projects, setProjects] = useState([]);

  useEffect(() => {
   if (workspaceId) {
      fetchProjects(workspaceId);
   }
}, [workspaceId]);

  const fetchProjects = async (workspaceId) => {
    try {
      const data = await getProjects(workspaceId);
      const projectList = data.projects;
      setProjects(projectList);
    } catch (error) {
      console.log("Failed to fetch projects: ", error);
    }  
  }
  
  return (
    <aside className={`sidebar flex w-full flex-col overflow-hidden border-b ${
      isDark
        ? 'is-dark border-slate-800 bg-[#080d19] text-slate-100'
        : 'border-slate-200 bg-slate-50 text-slate-900'
      } 
      lg:fixed lg:left-0 lg:top-16 lg:z-30 lg:h-[calc(100vh-4rem)] lg:w-72 lg:border-b-0 lg:border-r`}
    >
      <div className="flex-1 overflow-y-auto px-4 py-6 lg:px-6 lg:py-8">

        {/* ── Workspace section ── */}
        <div className="mb-6">
          <div className="flex items-center justify-between px-3 pb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Workspace
            </span>
            <button
              className="!text-[#0082E6] hover:text-blue-400 p-1 rounded hover:bg-slate-800/40 transition-colors focus:outline-none"
              title="Create Workspace"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
            </button>
          </div>

          {/* Workspace switcher */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setWorkspaceDropdownOpen(v => !v)}
              className={`flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 transition-colors ${
                isDark
                  ? 'bg-white/[0.04] hover:bg-white/[0.07] text-slate-200'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-800'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-[13px] font-semibold shrink-0 ${
                  isDark ? 'bg-indigo-600 text-indigo-200' : 'bg-indigo-100 text-indigo-700'
                }`}>
                  {activeWorkspace?.name?.charAt(0)?.toUpperCase() || "W"}
                </div>
                <span className="text-sm font-medium truncate">{activeWorkspace?.name}</span>
              </div>
              <svg
                className={`w-4 h-4 text-slate-500 shrink-0 transition-transform ${workspaceDropdownOpen ? 'rotate-180' : ''}`}
                fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* Dropdown list */}
            {workspaceDropdownOpen && (
              <div className={`absolute left-0 right-0 z-50 mt-1 rounded-lg border py-1 shadow-lg ${
                isDark
                  ? 'bg-[#0f1724] border-slate-700/60'
                  : 'bg-white border-slate-200'
              }`}>
                {workspaces.map(ws => (
                  <button
                    key={ws._id}
                    onClick={() => {
                      navigate(`/workspaces/${ws._id}`);
                      setWorkspaceDropdownOpen(false);
                    }}
                    className={`flex w-full items-center gap-2.5 pl-2 pr-3 py-2 text-sm transition-colors ${
                      ws._id === workspaceId
                        ? isDark ? 'text-indigo-400 bg-indigo-500/10' : 'text-indigo-600 bg-indigo-50'
                        : isDark ? 'text-slate-300 hover:bg-white/[0.05]' : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div className="w-5 h-5 rounded bg-gradient-to-br from-fuchsia-600 to-violet-700 flex items-center justify-center text-[10px] shrink-0">
                      🏢
                    </div>
                    <span className="truncate">{ws.name}</span>
                    {ws._id === workspaceId && (
                      <svg className="ml-auto w-3.5 h-3.5 text-indigo-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Invite + Settings */}
         <div className="mt-1 flex items-center">
            <button className={`flex flex-1 items-center justify-center gap-2 h-[34px] rounded-lg text-[12px] transition-colors ${
              isDark ? 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.05]' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'
            }`}>
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
              <span className="text-[12px] font-normal tracking-wider">
                Invite
              </span>
            </button>

            <div className={`w-px h-5 shrink-0 ${isDark ? 'bg-slate-800' : 'bg-slate-200'}`} />
            <button className={`w-[40px] h-[32px] flex items-center justify-center rounded-lg transition-colors ${
              isDark ? 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.05]' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'
            }`}>
              <svg className="w-4.5 h-4.5 pr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
          </div>
        </div>

        {/* ── Divider ── */}
        <div className={`mb-6 h-px w-full ${isDark ? 'bg-slate-800/60' : 'bg-slate-200/80'}`} />
            
        {/* ── Nav items ── */}
        <div className="space-y-1">
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
                      ? 'rounded-xl bg-[#1e2d45] text-indigo-300'
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

        {/* ── Divider ── */}
        <div className={`my-6 h-px w-full ${isDark ? 'bg-slate-800/60' : 'bg-slate-200/80'}`} />

        {/* ── Projects ── */}
        <div className="space-y-1">
          <div className="flex items-center justify-between px-3 pb-2">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              Projects
            </div>
            <button
              type="button"
              onClick={() => setProjectsExpanded(v => !v)}
              className={`text-slate-500 transition-colors ${isDark ? 'hover:text-slate-300' : 'hover:text-slate-700'}`}
              aria-label={projectsExpanded ? 'Collapse projects' : 'Expand projects'}
            >
              <svg
                className={`h-3.5 w-3.5 transition-transform ${projectsExpanded ? '' : '-rotate-90'}`}
                fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>

          {projectsExpanded && (
            <div className="space-y-1">
              {projects.map((project) => (
                <div
                    key={project._id}
                    onClick={() => {
                      navigate(
                        `/workspaces/${workspaceId}/projects/${project._id}`
                      );
                    }}
                    className={`group flex cursor-pointer items-center gap-3.5 px-3 py-2 text-sm font-semibold transition-colors ${
                      projectId === project._id
                          ? isDark
                            ? 'bg-white/[0.05] text-white rounded-md'
                            : 'bg-slate-100 text-slate-900 rounded-md'
                          : isDark
                            ? 'text-slate-300 hover:text-white hover:bg-white/[0.02] rounded-md'
                            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-md'
                    }`}
                >
                    <span className="h-2 w-2 rounded-full bg-emerald-500" />
                    <span>{project.name}</span>
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