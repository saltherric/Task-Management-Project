import React, { useContext, useState, useRef, useEffect } from 'react';
import { ThemeContext } from '../../contexts/ThemeContext';
import {getWorkspaces, createWorkspace} from '../../services/workspaceApi';
import {getProjects, createProject} from '../../services/projectApi';
import { useNavigate, useParams, useLocation } from "react-router-dom";
import WorkspaceModal from './WorkspaceModal';
import ProjectModal from './ProjectModal';
import InviteModal from './InviteModal';
import SettingModal from './SettingModal';
import { Lock, Globe } from 'lucide-react';
import { useSocket } from '../../contexts/SocketContext';
import { getStoredUserInfo } from '../../helpers/auth';
import { useAlert } from '../../contexts/AlertContext';

function Sidebar({ isOpen, onClose }) {
  const { theme } = useContext(ThemeContext);
  const isDark = theme === 'dark';
  const { showAlert } = useAlert();
  const [projectsExpanded, setProjectsExpanded] = useState(true);
  const dropdownRef = useRef(null);
  const [workspaces, setWorkspaces] = useState([]);
  const [workspaceDropdownOpen, setWorkspaceDropdownOpen] = useState(false);
  const [showCreateWorkspaceModal, setShowCreateWorkspaceModal] = useState(false);
  const [showCreateProjectModal, setShowCreateProjectModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showSettingModal, setShowSettingModal] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const { workspaceId, projectId} = useParams();

  const { socket, isConnected } = useSocket();
  const currentUser = getStoredUserInfo();
  const currentUserId = currentUser?._id || currentUser?.id;

  useEffect(() => {
    if (!socket || !isConnected || !workspaceId) return;

    const handleProjectUpdatedSocket = (payload) => {
      const updatedProject = payload.project;
      if (!updatedProject) return;

      const projWorkspaceId = updatedProject.workspace?._id || updatedProject.workspace;
      if (String(projWorkspaceId) !== String(workspaceId)) return;

      // Check if current user is allowed to see the project
      const isMember = (updatedProject.members || []).some((m) => {
        const mId = m.user?._id || m.user?.id || m.user;
        return String(mId) === String(currentUserId);
      });
      const isCreator = String(updatedProject.createdBy?._id || updatedProject.createdBy) === String(currentUserId);
      const isWorkspaceVisible = updatedProject.visibility === 'workspace';

      if (isCreator || isWorkspaceVisible || isMember) {
        // User has access, update or prepend the list
        setProjects((prev) => {
          const exists = prev.some((p) => p._id === updatedProject._id);
          if (exists) {
            return prev.map((p) => (p._id === updatedProject._id ? updatedProject : p));
          } else {
            return [updatedProject, ...prev];
          }
        });
      } else {
        // Access revoked (e.g. removed from members list), filter it out
        setProjects((prev) => prev.filter((p) => p._id !== updatedProject._id));
      }
    };

    const handleProjectDeletedSocket = (payload) => {
      const deletedProjId = payload.projectId;
      if (!deletedProjId) return;

      const deletedProjWorkspaceId = payload.workspaceId;
      if (deletedProjWorkspaceId && String(deletedProjWorkspaceId) !== String(workspaceId)) return;

      setProjects((prev) => prev.filter((p) => p._id !== deletedProjId));

      if (String(projectId) === String(deletedProjId)) {
        navigate(`/workspaces/${workspaceId}`);
      }
    };

    socket.on("project:updated", handleProjectUpdatedSocket);
    socket.on("project:deleted", handleProjectDeletedSocket);

    return () => {
      socket.off("project:updated", handleProjectUpdatedSocket);
      socket.off("project:deleted", handleProjectDeletedSocket);
    };
  }, [socket, isConnected, workspaceId, currentUserId, projectId, navigate]);

  
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

  const handleWorkspaceUpdated = (updatedWorkspace) => {
    setWorkspaces((prev) =>
      prev.map((ws) => (ws._id === updatedWorkspace._id ? updatedWorkspace : ws))
    );
  };

  const handleWorkspaceDeleted = (deletedWorkspaceId) => {
    setWorkspaces((prev) => prev.filter((ws) => ws._id !== deletedWorkspaceId));
    navigate("/home");
  };

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
    { 
      label: 'Dashboard', 
      icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>,
      onClick: () => {
        if (workspaceId) {
          navigate(`/workspaces/${workspaceId}`);
        }
        onClose?.();
      },
      active: !projectId && !location.pathname.includes('/analytics') && !location.pathname.includes('/activity')
    },
    { 
      label: 'Board', 
      icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" /></svg>,
      onClick: () => {
        if (workspaceId) {
          if (projectId) return;
          if (projects && projects.length > 0) {
            navigate(`/workspaces/${workspaceId}/projects/${projects[0]._id}`);
          } else {
            showAlert("No projects found. Please create a project first.", "info");
          }
        } else {
          showAlert("Please select or create a workspace first.", "info");
        }
        onClose?.();
      },
      active: !!projectId
    },
    { 
      label: 'Analytics', 
      icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 002 2h2a2 2 0 002-2z" /></svg>,
      onClick: () => {
        if (workspaceId) {
          navigate(`/workspaces/${workspaceId}/analytics`);
        }
        onClose?.();
      },
      active: location.pathname.includes('/analytics')
    },
    { 
      label: 'Activity', 
      icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
      onClick: () => {
        if (workspaceId) {
          navigate(`/workspaces/${workspaceId}/activity`);
        }
        onClose?.();
      },
      active: location.pathname.includes('/activity')
    },
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

  const handleCreateWorkspace = async (workspaceData) => {
    try {
      const respone = await createWorkspace(workspaceData);
      const newWorkspace = respone.workspace;
      setWorkspaces((prev) => [
        newWorkspace,
        ...prev
      ]);
      setShowCreateWorkspaceModal(false);
      showAlert("Workspace created successfully.", "success");
      if (newWorkspace?._id) {
        navigate(`/workspaces/${newWorkspace._id}`);
      }
    } catch (error) {
      console.error(error);
      showAlert(error.response?.data?.message || "Failed to create workspace.", "error");
    }
  };

  const handleCreateProject = async (formData) => {
    try {
      const response = await createProject({
        ...formData,
        workspace: workspaceId,
      });

      setProjects(prev => {
        const exists = prev.some((p) => p._id === response.project._id);
        if (exists) return prev;
        return [
          response.project,
          ...prev,
        ];
      });

      setShowCreateProjectModal(false);
      showAlert("Project created successfully.", "success");

      if (response.project?._id) {
        navigate(`/workspaces/${workspaceId}/projects/${response.project._id}`);
      }

    } catch (error) {
      console.error(error);
      showAlert(error.response?.data?.message || "Failed to create project.", "error");
    }
  };
  
  const handleInviteUser = async (formData) => {
    try {
      
    } catch (error) {
      
    }
  }

  return (
    <>
      {/* Backdrop for mobile */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-sm lg:hidden transition-opacity duration-300"
        />
      )}

      <aside className={`sidebar flex flex-col overflow-hidden border-r transition-transform duration-300 ease-in-out ${
        isDark
          ? 'is-dark border-slate-800 bg-[#080d19] text-slate-100'
          : 'border-slate-200 bg-slate-50 text-slate-900'
        } 
        fixed inset-y-0 left-0 z-50 w-72 
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 lg:fixed lg:left-0 lg:top-16 lg:z-30 lg:h-[calc(100vh-4rem)] lg:w-72 lg:border-b-0 lg:border-r`}
      >
        {/* Mobile Sidebar Header */}
        <div className={`flex items-center justify-between px-6 py-4 border-b lg:hidden ${
          isDark ? 'border-slate-800' : 'border-slate-200'
        }`}>
          <span className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-violet-400 to-indigo-500">
            TaskMe Menu
          </span>
          <button
            onClick={onClose}
            className={`p-1.5 rounded-xl border transition-colors ${
              isDark 
                ? 'border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800' 
                : 'border-slate-200 text-slate-500 hover:text-slate-700 hover:bg-slate-100'
            }`}
            aria-label="Close sidebar"
          >
            <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-6 lg:px-6 lg:py-8">

        {/* ── Workspace section ── */}
        <div className="mb-6">
          <div className="flex items-center justify-between px-3 pb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Workspace
            </span>
            <button
              onClick={() => setShowCreateWorkspaceModal(true)}
              className={`text-[#6366F1] hover:text-indigo-400 p-1 rounded ${isDark ? 'hover:bg-slate-800/40' : 'hover:bg-slate-200'} transition-colors focus:outline-none`}
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
                  isDark ? 'bg-indigo-400 text-indigo-200' : 'bg-indigo-100 text-indigo-700'
                }`}>
                  💼
                </div>
                <span className="text-xs font-medium truncate">{activeWorkspace?.name}</span>
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
                      onClose?.();
                    }}
                    className={`flex w-full items-center gap-2.5 pl-2 pr-3 py-2 text-sm transition-colors ${
                      ws._id === workspaceId
                        ? isDark ? 'text-indigo-400 bg-indigo-500/10' : 'text-indigo-600 bg-indigo-50'
                        : isDark ? 'text-slate-300 hover:bg-white/[0.05]' : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div className="w-5 h-5 rounded bg-gradient-to-br from-fuchsia-200 to-violet-400 flex items-center justify-center text-[10px] shrink-0">
                      💼
                    </div>
                    <span className="text-xs truncate">{ws.name}</span>
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
            <button
              onClick={() => setShowInviteModal(true)} 
              className={`flex flex-1 items-center justify-center gap-2 h-[34px] rounded-lg ml-3 mr-3 text-[12px] transition-colors ${
                isDark ? 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.05]' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'
              }`}>
                <div className={`flex flex-1 items-center justify-center gap-2 h-[30px] border border-dashed rounded-xl ${isDark ? 'border-slate-800' : 'border-slate-300'}`}>
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                  </svg>
                  <span className="text-[12px] font-normal tracking-wider ">
                    Invite
                  </span>
                </div>
                
            </button>



            <div className={`w-px h-5 shrink-0 ${isDark ? 'bg-slate-800' : 'bg-slate-200'}`} />
            <button 
              onClick={() => setShowSettingModal(true)}
              className={`w-[40px] h-[32px] flex items-center justify-center rounded-lg transition-colors ${
                isDark ? 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.05]' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'
              }`}
              title="Workspace Settings"
            >
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
            const isActive = item.active;
            return (
              <button
                key={item.label}
                type="button"
                onClick={item.onClick}
                className={`group relative flex w-full items-center gap-3.5 px-3 py-2.5 text-left text-sm font-semibold transition-colors ${
                  isActive
                    ? isDark
                      ? 'rounded-xl bg-white/[0.06] text-indigo-400'
                      : 'rounded-xl bg-indigo-50 text-indigo-650'
                    : isDark
                      ? 'text-slate-400 hover:text-slate-200 hover:bg-[#0f1724] rounded-lg'
                      : 'text-slate-650 hover:text-slate-900 hover:bg-slate-200 rounded-lg'
                }`}
                aria-pressed={isActive}
              >
                {isActive && (
                  <div className="absolute -left-3 top-1/2 h-[60%] w-1 -translate-y-1/2 rounded-r-md bg-[#6366F1]" />
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
            <div className='flex gap-1'>
              <button
                onClick={() => setShowCreateProjectModal(true)}
                className={`text-[#6366F1] hover:text-indigo-400 p-1 rounded ${isDark ? 'hover:bg-slate-800/40' : 'hover:bg-slate-200'} transition-colors focus:outline-none`}
                title="Create Project"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
              </button>
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
                      onClose?.();
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
                    {project.visibility === 'private' ? (
                      <Lock className="h-3.5 w-3.5 text-amber-500 shrink-0 animate-fade-in" title="Private Project" />
                    ) : (
                      <Globe className="h-3.5 w-3.5 text-slate-400 shrink-0 animate-fade-in" title="Workspace Project" />
                    )}
                    <span className="text-xs truncate">{project.name}</span>
                </div>                      
              ))}
            </div>
          )}
        </div>

      </div>
    </aside>

    {/* Modals rendered outside the transformed container to prevent squishing */}
    <WorkspaceModal
      isOpen={showCreateWorkspaceModal}
      onClose={() => setShowCreateWorkspaceModal(false)}
      onCreate={handleCreateWorkspace}
    />

    <ProjectModal
      isOpen={showCreateProjectModal}
      onClose={() => setShowCreateProjectModal(false)}
      onCreate={handleCreateProject}
    />

    <InviteModal
      isOpen={showInviteModal}
      workspaceId={workspaceId}
      onClose={() => setShowInviteModal(false)}
    />

    <SettingModal
      isOpen={showSettingModal}
      workspaceId={workspaceId}
      workspace={activeWorkspace}
      onClose={() => setShowSettingModal(false)}
      onWorkspaceUpdated={handleWorkspaceUpdated}
      onWorkspaceDeleted={handleWorkspaceDeleted}
    />
    </>
  );
}

export default Sidebar;