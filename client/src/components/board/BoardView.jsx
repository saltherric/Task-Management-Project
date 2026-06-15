import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from "react-router-dom";
import getProjects from '../../services/projectApi';
import { getTasksByProject, moveTask } from '../../services/taskApi';
import { getStoredUserInfo } from '../../helpers/auth';
import getColumns from '../../services/columnApi';
import TaskModal from '../taskModal/TaskModal';

function Board() {

  const navigate = useNavigate();
  const { projectId, workspaceId } = useParams();
  const [tasks, setTasks] = useState([]);
  const [columns, setColumns] = useState([]);
  const [projects, setProjects] = useState([]);
  const [selectedTask, setSelectedTask] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    if(projectId && workspaceId){
      fetchProjects(workspaceId);
      fetchColumns(projectId);
      fetchTasks(projectId);
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
  
  const activeProject = projects.find(p => p._id === projectId);

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

  // New Task Modal States
  const [targetColumn, setTargetColumn] = useState('To Do');
  const [newTitle, setNewTitle] = useState('');
  const [newPriority, setNewPriority] = useState('Medium');
  const [newassignedTo, setNewassignedTo] = useState('');

  // const columns = [
  //   { name: "To Do", dotColor: "bg-indigo-500" },
  //   { name: "In Progress", dotColor: "bg-blue-500" },
  //   { name: "In Review", dotColor: "bg-amber-500" },
  //   { name: "Done", dotColor: "bg-emerald-500" }
  // ];

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

  const handleTaskClick = (task) => {
    setSelectedTask(task);
    setIsModalOpen(true);
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

  // Add & Delete task logic
  // const handleAddTaskSubmit = (e) => {
  //   e.preventDefault();
  //   if (!newTitle.trim()) return;

  //   const newTask = {
  //     id: Date.now(),
  //     title: newTitle.trim(),
  //     category: newCategory,
  //     date: new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit' }),
  //     comments: 0,
  //     attachments: 0,
  //     assignedTo: newassignedTo ? newassignedTo.split(',').map(s => s.trim()) : ["KV"],
  //     priority: newPriority,
  //     column: targetColumn
  //   };

  //   setTasks(prev => [...prev, newTask]);
  //   setNewTitle('');
  //   setNewassignedTo('');
  //   setIsModalOpen(false);
  // };

  const handleDeleteTask = (taskId) => {
    setTasks(prev => prev.filter(t => t.id !== taskId));
  };

  const openAddTaskModal = (colName) => {
    setTargetColumn(colName);
    setIsModalOpen(true);
  };

  // Filter Tasks
  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase()) || task.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || task.category === selectedCategory;
    const matchesPriority = selectedPriority === 'All' || task.priority === selectedPriority;
    return matchesSearch && matchesCategory && matchesPriority;
  });

  return (
    <div className="h-full w-full bg-slate-900 text-slate-100 p-6 md:p-5 overflow-hidden">
      <div className="h-full max-w-7xl mx-auto flex flex-col">
        
        {/* Board Title Area */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-3.5">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-white flex items-center gap-2">
              {activeProject?.name}
              <span className="text-xs font-semibold px-2 py-1 bg-slate-800 text-slate-400 rounded-lg">Sprint 14</span>
            </h1>
            <p className="text-xs text-slate-500 font-medium mt-1">Ends in 5 days · Active Scrum Board</p>
          </div>

          {/* Avatar and Info Row */}
          <div className="flex items-center gap-3">
            <div className="flex -space-x-1 overflow-hidden">
              {["KV", "SR", "MN", "LP"].map((user, idx) => (
                <div 
                  key={idx} 
                  className="flex h-8 w-8 rounded-full ring-2 ring-slate-900 bg-slate-800 text-xs font-bold text-slate-300 flex items-center justify-center cursor-default"
                  title={user}
                >
                  {user}
                </div>
              ))}
            </div>
            <div className="h-4 w-[1px] bg-slate-800" />
            <span className="text-xs text-slate-400 font-medium">4 team members</span>
          </div>
        </div>

        {/* Kanban Board Grid */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 pt-3 overflow-hidden">
          {columns.map((col) => {
            const columnTasks = filteredTasks.filter(t => ( t.column._id || t.column ) === col._id);
            return (
              <div 
                key={col._id}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, col._id)}
                className="bg-slate-950/40 border border-slate-800 rounded-2xl p-4 h-full min-h-0 flex flex-col"
              >
                {/* Column Header */}
                <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-900">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${col.dotColor}`} />
                    <span className="text-xs font-bold tracking-wider text-slate-300 uppercase">{col.name}</span>
                    <span className="text-[10px] bg-slate-800 text-slate-400 font-bold px-2 py-0.5 rounded-full">
                      {columnTasks.length}
                    </span>
                  </div>
                  <button 
                    onClick={() => openAddTaskModal(col._id)}
                    className="p-1 rounded-lg text-slate-500 hover:text-indigo-400 hover:bg-slate-900 transition-colors"
                    title="Add task to column"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                    </svg>
                  </button>
                </div>

                {/* Task Stack */}
                <div className="space-y-3 flex-1 overflow-y-auto pr-0.5 scrollbar-thin">
                  {columnTasks.map((task) => (
                    <TaskCard 
                      key={task._id} 
                      task={task} 
                      onDragStart={handleDragStart} 
                      onClick={handleTaskClick}
                      onDelete={handleDeleteTask}
                    />
                  ))}
                  {columnTasks.length === 0 && (
                    <div className="text-center py-10 border border-dashed border-slate-800 rounded-xl">
                      <p className="text-[11px] text-slate-600">Drop tasks here</p>
                    </div>
                  )}
                </div>

                {/* Bottom Column Quick Add Action Button */}
                <button
                  onClick={() => openAddTaskModal(col._id)}
                  className="w-full mt-4 py-2 rounded-xl border border-dashed border-slate-800 text-slate-500 hover:text-slate-300 hover:border-slate-700 hover:bg-slate-900/20 text-xs font-semibold transition-all duration-200 flex items-center justify-center gap-1.5"
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

      {/* Task Modal */}
      <TaskModal 
        task={selectedTask}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedTask(null);
        }}
        onUpdateTask={handleTaskUpdated}
      />
    </div>
  );
}
export default Board;

// Specialized Inner Card Component
function TaskCard({ task, onDragStart, onDelete, onClick }) {
  
  const getTagStyles = (tag) => {
    switch (tag) {
      case "design": return "bg-purple-950/40 text-purple-400 border border-purple-800/20";
      case "research": return "bg-sky-950/40 text-sky-400 border border-sky-800/20";
      case "frontend": return "bg-amber-950/40 text-amber-400 border border-amber-800/20";
      case "backend": return "bg-emerald-950/40 text-emerald-400 border border-emerald-800/20";
      case "AI": return "bg-pink-950/40 text-pink-400 border border-pink-800/20";
      case "devOps": return "bg-indigo-950/40 text-indigo-400 border border-indigo-800/20";
      default: return "bg-slate-950/40 text-slate-400 border border-slate-800";
    }
  };

  const getPriorityStyles = (prio) => {
    switch (prio) {
      case "high": return "bg-rose-950/40 text-rose-400 border border-rose-900/30";
      case "medium": return "bg-amber-950/40 text-amber-400 border border-amber-900/30";
      case "low": return "bg-emerald-950/40 text-emerald-400 border border-emerald-900/30";
      default: return "bg-slate-950/40 text-slate-400 border border-slate-800";
    }
  };

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
      className="group bg-slate-900 hover:bg-slate-900/80 border border-slate-800 hover:border-slate-700 p-4 rounded-2xl shadow-sm hover:shadow-md transition-all duration-200 cursor-grab active:cursor-grabbing relative"
    >
      {/* Category tag & quick delete action */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-1 flex-wrap">
          {task.tags?.map(tag => (
            <span
              key={tag}
              className={`text-[9px] font-bold px-2 py-0.5 rounded-md tracking-wider ${getTagStyles(tag)}`}
            >
              {tag}
            </span>
          ))}
        </div>
        <button 
          onClick={() => onDelete(task.id)}
          className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-rose-400 p-0.5 rounded transition-all duration-150"
          title="Delete Task"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>

      {/* Task Title */}
      <h3 className="text-xs font-bold text-slate-100 group-hover:text-indigo-400 leading-normal tracking-wide transition-colors mb-4">
        {task.title}
      </h3>

      {/* Meta counters, assignedTo, and dates */}
      <div className="flex items-center justify-between pt-3 border-t border-slate-800/80">
        <div className="flex items-center gap-2 text-[10px] text-slate-500 font-medium">
          {/* Calendar Date */}
          <div className="flex items-center gap-1">
            <svg className="w-3.5 h-3.5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
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

          {/* Comments count */}
          {task.comments > 0 && (
            <div className="flex items-center gap-1">
              <svg className="w-3.5 h-3.5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <span>{task.comments}</span>
            </div>
          )}

          {/* Attachments count */}
          {task.attachments > 0 && (
            <div className="flex items-center gap-0.5">
              <svg className="w-3.5 h-3.5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.172 7l-6.586 6.586a2 2 0 11-2.828-2.828l6.414-6.414a4 4 0 015.656 5.656l-6.415 6.415a6 6 0 11-8.486-8.486L10.5 10" />
              </svg>
              <span>{task.attachments}</span>
            </div>
          )}
        </div>

        {/* Assigned Users Initial Circles */}
        <div className="flex -space-x-1 ">
          {task.assignedTo?.map(user => (
            <div
              key={user._id}
              className="h-6 w-6 rounded-full bg-slate-800 text-[8px] flex items-center justify-center"
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