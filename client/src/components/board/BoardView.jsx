import React, { useState, useEffect, useContext, useMemo } from 'react';
import { useParams, useNavigate } from "react-router-dom";
import { getProjects, updateProject } from '../../services/projectApi';
import { getTasksByProject, moveTask, createTask } from '../../services/taskApi';
import { getStoredUserInfo } from '../../helpers/auth';
import getColumns from '../../services/columnApi';
import TaskModal from '../taskModal/TaskModal';
import AddTaskModal from './AddTaskModal';
import InviteTaskModal from './InviteTaskModal';
import MenuModal from './MenuModal';
import { useSocket } from '../../contexts/SocketContext';
import { ThemeContext } from '../../contexts/ThemeContext';
import { getWorkspaceMembers } from '../../services/workspaceApi';
import { UserPlus, MoreVertical } from 'lucide-react';

function Board() {

  const { theme } = useContext(ThemeContext);
  const isDark = theme === 'dark';

  const navigate = useNavigate();
  const { projectId, workspaceId } = useParams();
  const [tasks, setTasks] = useState([]);
  const [columns, setColumns] = useState([]);
  const [projects, setProjects] = useState([]);
  const [members, setMembers] = useState([]);
  const [selectedTask, setSelectedTask] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showCreateTaskModal, setShowCreateTaskModal] = useState(false);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [isMenuModalOpen, setIsMenuModalOpen] = useState(false);
  const [selectedColumn, setSelectedColumn] = useState(null);
  const { socket, isConnected, joinWorkspace, leaveWorkspace } = useSocket();

  useEffect(() => {
    if(projectId && workspaceId){
      fetchProjects(workspaceId);
      fetchColumns(projectId);
      fetchTasks(projectId);
      fetchMembers(workspaceId);
    }
  }, [projectId, workspaceId]);

  const fetchProjects = async (workspaceId) => {
    try {
      const data = await getProjects(workspaceId);
      const projectList = data.projects;
      setProjects(projectList);
    } catch (error) {
      console.error(error);
    }
  }

  const fetchMembers = async (workspaceId) => {
    try {
      const data = await getWorkspaceMembers(workspaceId);
      setMembers(data.members || []);
    } catch (error) {
      console.error("Failed to fetch workspace members:", error);
    }
  };
  
  const activeProject = projects.find(p => String(p._id) === String(projectId));

  const fetchColumns = async (projectId) => {
    try {
      const data = await getColumns(projectId);
      const columnsList = data.columns;
      setColumns(columnsList);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchTasks = async (projectId) => {
    try {
      const userInfo = getStoredUserInfo();

      if (!userInfo?.token) {
        navigate("/login");
        return;
      }

      const data = await getTasksByProject(projectId);
      const taskList = data.tasks;
      setTasks(taskList);
    } catch (error) {
      console.log("Failed to fetch tasks: ", error);
    }
  }
  // Filters & State Management
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedPriority, setSelectedPriority] = useState('All');
  const [draggedTaskId, setDraggedTaskId] = useState(null);

  // HTML5 Drag and Drop Handlers
  const handleDragStart = (e, taskId) => {
    setDraggedTaskId(taskId);
    e.dataTransfer.setData("text/plain", taskId);
    e.dataTransfer.effectAllowed = "move";
  };   

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = async (e, columnId) => {
    e.preventDefault();

    const taskId = e.dataTransfer.getData("text/plain");

    // optimistic update
    setTasks(prev =>
      prev.map(task =>
        task._id === taskId
          ? { ...task, column: columnId }
          : task
      )
    );

    try {
      await moveTask(taskId, columnId);
    } catch (error) {
      console.error(error);

      // reload if update failed
      fetchTasks(projectId);
    }
  };

  const handleCreateTask = async ( formData ) => {
    try {
      const response = await createTask({
        ...formData,
        project: projectId,
        column: selectedColumn,
      });
      const createdTask = response?.task ?? response;
      setTasks((prev) => {
        // avoid inserting duplicates if socket also emits the created task
        const exists = createdTask?._id
          ? prev.some(t => t._id === createdTask._id)
          : createdTask?.id
            ? prev.some(t => t.id === createdTask.id)
            : false;

        if (exists) return prev;

        return [...prev, createdTask];
      });

      setShowCreateTaskModal(false);
    } catch (error) {
      console.error(error);
    }
  };

  const handleTaskClick = (task) => {
    setSelectedTask(task);
    setIsModalOpen(true);
  };

  const handleProjectUpdated = (updatedProject) => {
    setProjects(prev =>
      prev.map(p => String(p._id) === String(updatedProject._id) ? updatedProject : p)
    );
  };

  const handleUpdateVisibility = async (newVis) => {
    try {
      const data = await updateProject(projectId, { visibility: newVis });
      if (data.success) {
        handleProjectUpdated(data.project);
      }
    } catch (error) {
      console.error("Failed to update project visibility:", error);
    }
  };

  const handleTaskUpdated = (updatedTask) => {
    setTasks(prev =>
      prev.map(task =>
        task._id === updatedTask._id
          ? updatedTask
          : task
      )
    );

    setSelectedTask(updatedTask);
  };

  const handleTaskDeleted = (taskId) => {
    setTasks(prev =>
      prev.filter(task => task._id !== taskId)
    );

    setSelectedTask(null);
    setIsModalOpen(false);
  };

  useEffect(() => {
    if (!socket || !isConnected || !workspaceId) {
      return;
    }

    let isMounted = true;

    const registerWorkspaceRoom = async () => {
      const response = await joinWorkspace(workspaceId);
      if (isMounted && response?.success === false) {
        console.error("Failed to join workspace room:", response.message);
      }
    };

    const upsertTask = (incomingTask) => {
      if (!incomingTask) return;

      setTasks((prev) => {
        // match by _id or id to handle different shapes from API/socket
        const matchIndex = prev.findIndex((task) => {
          if (incomingTask._id && task._id) return task._id === incomingTask._id;
          if (incomingTask.id && task.id) return task.id === incomingTask.id;
          return false;
        });

        if (matchIndex === -1) {
          return [...prev, incomingTask];
        }

        const next = [...prev];
        next[matchIndex] = incomingTask;
        return next;
      });

      setSelectedTask((prev) => {
        if (!prev) return prev;
        if (prev._id !== incomingTask._id) return prev;
        
        return incomingTask;
      });
    };

    const handleTaskCreated = (payload) => {
      if (payload?.projectId !== projectId) return;
      upsertTask(payload.task);
    };

    const handleTaskUpdatedEvent = (payload) => {
      console.log("Received:", payload);
      if (payload?.projectId !== projectId) return;
      upsertTask(payload.task);
    };

    const handleTaskMoved = (payload) => {
      if (payload?.projectId !== projectId) return;
      upsertTask(payload.task);
    };

    const handleTaskDeletedEvent = (payload) => {
      if (String(payload.projectId) !== String(projectId)) return;

      setTasks((prev) =>
        prev.filter((task) => task._id !== payload.taskId)
      );

      setSelectedTask((prev) => {
        if (!prev) return null;

        return String(prev._id) === String(payload.taskId)
          ? null
          : prev;
      });

      setIsModalOpen((prev) => {
        if (!selectedTask) return prev;

        return String(selectedTask._id) === String(payload.taskId)
          ? false
          : prev;
      });
    };

    const handleTaskArchivedEvent = (payload) => {
      if (payload?.projectId !== projectId) return;

      const targetTaskId = payload.task?._id || payload.task?.id;
      if (!targetTaskId) return;

      setTasks((prev) =>
        prev.filter((task) => (task._id || task.id) !== targetTaskId)
      );

      setSelectedTask((prev) => {
        if (!prev) return null;
        const prevId = prev._id || prev.id;
        return String(prevId) === String(targetTaskId) ? null : prev;
      });

      setIsModalOpen((prev) => {
        if (!selectedTask) return prev;
        const selectedId = selectedTask._id || selectedTask.id;
        return String(selectedId) === String(targetTaskId) ? false : prev;
      });
    };

    const handleTaskUnarchivedEvent = (payload) => {
      if (payload?.projectId !== projectId) return;
      upsertTask(payload.task);
    };

    const handleProjectUpdatedEvent = (payload) => {
      if (payload?.project) {
        handleProjectUpdated(payload.project);
      }
    };

    registerWorkspaceRoom();
    socket.on("task:created", handleTaskCreated);
    socket.on("task:updated", handleTaskUpdatedEvent);
    socket.on("task:moved", handleTaskMoved);
    socket.on("task:deleted", handleTaskDeletedEvent);
    socket.on("task:archived", handleTaskArchivedEvent);
    socket.on("task:unarchived", handleTaskUnarchivedEvent);
    socket.on("project:updated", handleProjectUpdatedEvent);

    return () => {
      isMounted = false;
      leaveWorkspace(workspaceId);
      socket.off("task:created", handleTaskCreated);
      socket.off("task:updated", handleTaskUpdatedEvent);
      socket.off("task:moved", handleTaskMoved);
      socket.off("task:deleted", handleTaskDeletedEvent);
      socket.off("task:archived", handleTaskArchivedEvent);
      socket.off("task:unarchived", handleTaskUnarchivedEvent);
      socket.off("project:updated", handleProjectUpdatedEvent);
    };
  }, [socket, isConnected, workspaceId, projectId, joinWorkspace, leaveWorkspace]);

  const projectMembers = useMemo(() => {
    if (!activeProject) return [];
    
    if (activeProject.visibility === 'workspace') {
      return members;
    }

    // Creator
    const creator = activeProject.createdBy ? {
      _id: activeProject.createdBy._id || activeProject.createdBy,
      username: activeProject.createdBy.username,
      email: activeProject.createdBy.email,
      avatar: activeProject.createdBy.avatar
    } : null;

    // Invited members
    const invited = (activeProject.members || []).map(m => m.user).filter(Boolean);

    // Combine and remove duplicates
    const all = creator ? [creator, ...invited] : invited;
    const seen = new Set();
    return all.filter(m => {
      const id = String(m._id || m.id || m);
      if (seen.has(id)) return false;
      seen.add(id);
      return true;
    });
  }, [activeProject, members]);

  const openAddTaskModal = (columnId) => {
    setSelectedColumn(columnId);
    setShowCreateTaskModal(true);
  };

  return (
    <div className={`h-full w-full p-6 md:p-5 overflow-hidden transition-colors duration-300 ${isDark ? 'bg-[#090D16] text-slate-100' : 'bg-slate-50 text-slate-800'}`}>
      <div className="h-full max-w-7xl mx-auto flex flex-col">
        
        {/* Board Title Area */}
        <div className={`flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-3.5 ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
          <div>
            <h1 className={`text-3xl font-extrabold tracking-tight flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
              {activeProject?.name}
            </h1>
            <p className={`text-xs font-medium mt-1 ${isDark ? 'text-slate-500' : 'text-slate-450'}`}>Active Scrum Board</p>
          </div>

          {/* Avatar and Info Row */}
          <div className="flex items-center gap-3">
            <div className="flex -space-x-1 overflow-hidden">
              {projectMembers.slice(0, 4).map((member, idx) => {
                const username = member.username || member.email || 'User';
                const initials = username
                  .split(" ")
                  .filter(Boolean)
                  .map(word => word.charAt(0).toUpperCase())
                  .slice(0, 2)
                  .join("") || "U";
                return member.avatar ? (
                  <img
                    key={member._id || idx}
                    src={member.avatar}
                    alt={username}
                    className={`h-8 w-8 rounded-full object-cover ring-2 cursor-default ${isDark ? 'ring-[#090D16]' : 'ring-slate-50'}`}
                    title={username}
                  />
                ) : (
                  <div 
                    key={member._id || idx} 
                    className={`flex h-8 w-8 rounded-full ring-2 text-xs font-bold flex items-center justify-center cursor-default ${isDark ? 'ring-[#090D16] bg-slate-800 text-slate-300' : 'ring-slate-50 bg-slate-200 text-slate-700'}`}
                    title={username}
                  >
                    {initials}
                  </div>
                );
              })}
              {projectMembers.length > 4 && (
                <div 
                  className={`flex h-8 w-8 rounded-full ring-2 text-xs font-bold flex items-center justify-center cursor-default ${isDark ? 'ring-[#090D16] bg-slate-800 text-slate-300' : 'ring-slate-50 bg-slate-200 text-slate-700'}`}
                  title={`${projectMembers.length - 4} more members`}
                >
                  +{projectMembers.length - 4}
                </div>
              )}
            </div>

            <span className={`w-[1px] h-6 mx-1 ${isDark ? 'bg-slate-800' : 'bg-slate-200'}`} />

            <div className="flex items-center gap-1.5">
              <button 
                onClick={() => setIsInviteModalOpen(true)}
                className={`p-1.5 rounded-xl transition-all duration-200 ${isDark ? 'text-slate-400 hover:text-indigo-400 hover:bg-slate-900 border border-slate-800/40' : 'text-slate-500 hover:text-indigo-650 hover:bg-slate-100 border border-slate-200/50'}`}
                title="Invite Members"
              >
                <UserPlus className="w-4 h-4" />
              </button>
              <button 
                onClick={() => setIsMenuModalOpen(true)}
                className={`p-1.5 rounded-xl transition-all duration-200 ${isDark ? 'text-slate-400 hover:text-indigo-400 hover:bg-slate-900 border border-slate-800/40' : 'text-slate-500 hover:text-indigo-650 hover:bg-slate-100 border border-slate-200/50'}`}
                title="Board Settings"
              >
                <MoreVertical className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/*  */}
        </div>

        {/* Kanban Board Grid */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 pt-3 overflow-hidden">
          {columns.map((col) => {
            const columnTasks = tasks.filter((task) => {
              const taskColumnId =
                typeof task.column === "object"
                  ? task.column?._id
                  : task.column;

              return taskColumnId === col._id;
            });

            return (
              <div 
                key={col._id}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, col._id)}
                className={`border rounded-2xl p-4 h-full min-h-0 flex flex-col transition-colors duration-300 ${isDark ? 'bg-slate-950/40 border-slate-800' : 'bg-white border-slate-200/80 shadow-sm'}`}
              >
                {/* Column Header */}
                <div className={`flex items-center justify-between mb-4 pb-2 border-b ${isDark ? 'border-slate-900' : 'border-slate-100'}`}>
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${col.dotColor}`} />
                    <span className={`text-xs font-bold tracking-wider uppercase ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{col.name}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${isDark ? 'bg-slate-800 text-slate-400' : 'bg-slate-100 text-slate-500'}`}>
                      {columnTasks.length}
                    </span>
                  </div>
                  <button 
                    onClick={() => openAddTaskModal(col._id)}
                    className={`p-1 rounded-lg transition-colors ${isDark ? 'text-slate-500 hover:text-indigo-400 hover:bg-slate-900' : 'text-slate-400 hover:text-indigo-600 hover:bg-slate-100'}`}
                    title="Add task to column"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                    </svg>
                  </button>
                </div>

                {/* Task Stack */}
                <div className="space-y-3 flex-1 overflow-y-auto pr-0.5 scrollbar-thin">
                  {columnTasks.map((task, index) => (
                    <TaskCard 
                      key={task._id || task.id || `${col._id}-task-${index}`}
                      task={task} 
                      onDragStart={handleDragStart} 
                      onClick={handleTaskClick}
                    />
                  ))}
                  {columnTasks.length === 0 && (
                    <div className={`text-center py-10 border border-dashed rounded-xl ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
                      <p className={`text-[11px] ${isDark ? 'text-slate-600' : 'text-slate-400'}`}>Drop tasks here</p>
                    </div>
                  )}
                </div>

                {/* Bottom Column Quick Add Action Button */}
                <button
                  onClick={() => openAddTaskModal(col._id)}
                  className={`w-full mt-4 py-2 rounded-xl border border-dashed text-xs font-semibold transition-all duration-200 flex items-center justify-center gap-1.5 ${isDark ? 'border-slate-800 text-slate-500 hover:text-slate-300 hover:border-slate-700 hover:bg-slate-900/20' : 'border-slate-200 text-slate-500 hover:text-slate-700 hover:border-slate-300 hover:bg-slate-50'}`}
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                  </svg>
                  Add task
                </button>
              </div>
            );
          })}
        </div>
      </div>
        
      {/* Add task Modal */}
      <AddTaskModal
        isOpen={showCreateTaskModal}
        onClose={() => {
          setShowCreateTaskModal(false);
          setSelectedColumn(null);
        }}
        projectId={projectId}
        columnId={selectedColumn}
        onCreate={handleCreateTask}
      />

      {/* Task Modal */}
      <TaskModal 
        task={selectedTask}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedTask(null);
        }}
        onUpdateTask={handleTaskUpdated}
        onDeleteTask={handleTaskDeleted}
      />

      {/* Invite Task Modal (Project Member Management) */}
      <InviteTaskModal
        isOpen={isInviteModalOpen}
        project={activeProject}
        projectId={projectId}
        workspaceId={workspaceId}
        onClose={() => setIsInviteModalOpen(false)}
        onProjectUpdated={handleProjectUpdated}
      />

      {/* Menu / Settings Drawer Modal */}
      <MenuModal
        isOpen={isMenuModalOpen}
        onClose={() => setIsMenuModalOpen(false)}
        project={activeProject}
        isDark={isDark}
        workspaceMembersCount={members.length}
        onProjectUpdated={handleProjectUpdated}
        onManageMembers={() => {
          setIsMenuModalOpen(false);
          setIsInviteModalOpen(true);
        }}
        onChangeVisibility={handleUpdateVisibility}
        onViewArchived={() => console.log('View archived')}
        onCopyBoard={() => console.log('Copy board')}
        onDeleteProject={() => console.log('Delete project')}
      />
    </div>
  );
}
export default Board;

// Specialized Inner Card Component
function TaskCard({ task, onDragStart, onClick }) {
  const { theme } = useContext(ThemeContext);
  const isDark = theme === 'dark';
  
  const getTagStyles = (tag) => {
    if (isDark) {
      switch (tag) {
        case "design": return "bg-purple-950/40 text-purple-400 border border-purple-800/20";
        case "research": return "bg-sky-950/40 text-sky-400 border border-sky-800/20";
        case "frontend": return "bg-amber-950/40 text-amber-400 border border-amber-800/20";
        case "backend": return "bg-emerald-950/40 text-emerald-400 border border-emerald-800/20";
        case "AI": return "bg-pink-950/40 text-pink-400 border border-pink-800/20";
        case "devOps": return "bg-indigo-950/40 text-indigo-400 border border-indigo-800/20";
        default: return "bg-slate-950/40 text-slate-400 border border-slate-800";
      }
    } else {
      switch (tag) {
        case "design": return "bg-purple-50 text-purple-600 border border-purple-200/50";
        case "research": return "bg-sky-50 text-sky-600 border border-sky-200/50";
        case "frontend": return "bg-amber-50 text-amber-600 border border-amber-200/50";
        case "backend": return "bg-emerald-50 text-emerald-600 border border-emerald-200/50";
        case "AI": return "bg-pink-50 text-pink-600 border border-pink-200/50";
        case "devOps": return "bg-indigo-50 text-indigo-600 border border-indigo-200/50";
        default: return "bg-slate-100 text-slate-600 border border-slate-200";
      }
    }
  };

  const getPriorityStyles = (prio) => {
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

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const dueDate = task.dueDate
    ? new Date(task.dueDate)
    : null;

  const isOverdue =
    dueDate &&
    dueDate < today;

  const getInitials = (name) => {
    if (!name) return "??" || "";
    return name
      .split(" ")
      .map(word => word.charAt(0).toUpperCase())
      .slice(0, 2)
      .join("");
  };

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, task._id)}
      onClick={() => onClick(task)}
      className={`group p-4 rounded-2xl shadow-sm hover:shadow-md transition-all duration-200 cursor-grab active:cursor-grabbing relative border ${isDark ? 'bg-slate-900 hover:bg-slate-900/80 border-slate-800 hover:border-slate-700' : 'bg-white hover:bg-slate-50/55 border-slate-200 hover:border-slate-300'}`}
    >
      {/* Task Tags */}
      <div className="flex flex-wrap gap-1 pb-2.5">
        {(task.tags || []).map((tag, index) => (
          <span
            key={`${tag || "tag"}-${index}`}
            className={`text-[9px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider ${getTagStyles(tag)}`}
          >
            {tag}
          </span>
        ))}
      </div>

      {/* Task Title */}
      <h3 className={`text-xs font-bold leading-normal tracking-wide transition-colors mb-4 ${isDark ? 'text-slate-100 group-hover:text-indigo-400' : 'text-slate-800 group-hover:text-indigo-600'}`}>
        {task.title}
      </h3>

      {/* Meta counters, assignedTo, and dates */}
      <div className={`flex items-center justify-between pt-3 border-t ${isDark ? 'border-slate-800/80' : 'border-slate-100'}`}>
        <div className={`flex items-center gap-2 text-[10px] font-medium ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
          {/* Calendar Date */}
          { task.dueDate && (
            <div className={`flex items-center gap-1 ${
              isOverdue 
                ? "text-red-400"
                : (isDark ? "text-neutral-400" : "text-neutral-500")
              }`}
            >
              <svg className={`w-3.5 h-3.5 ${isDark ? "text-slate-600" : "text-slate-400"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span>
                {new Date(task.dueDate).toLocaleDateString(
                  "en-US",
                  {
                    month: "short",
                    day: "numeric"
                  }
                )}
              </span>
            </div>
          )}
          
          {/* Comments count */}
          {task.commentCount > 0 && (
            <div className="flex items-center gap-1">
              <svg className={`w-3.5 h-3.5 ${isDark ? "text-slate-600" : "text-slate-400"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <span>{task.commentCount}</span>
            </div>
          )}

          {/* Attachments count */}
          {task.attachmentCount > 0 && (
            <div className="flex items-center gap-0.5">
              <svg className={`w-3.5 h-3.5 ${isDark ? "text-slate-600" : "text-slate-400"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.172 7l-6.586 6.586a2 2 0 11-2.828-2.828l6.414-6.414a4 4 0 015.656 5.656l-6.415 6.415a6 6 0 11-8.486-8.486L10.5 10" />
              </svg>
              <span>{task.attachmentCount}</span>
            </div>
          )}
        </div>

        {/* Assigned Users Initial Circles */}
        <div className="flex -space-x-1 ">
          {task.assignedTo?.map((user, index) => (
            <div
              key={user._id || user.id || user.username || `assignee-${index}`}
              className={`h-6 w-6 rounded-full text-[8px] flex items-center justify-center ${isDark ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-600'}`}
            >
              {getInitials(user.username)}
            </div>
          ))}
        </div>
      </div>

      {/* Priority level details */}
      <div className="mt-3 flex items-center justify-between">
        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-md ${getPriorityStyles(task.priority)}`}>
          {task.priority} priority
        </span>
      </div>
    </div>
  );
}
