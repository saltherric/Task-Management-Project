import React, { useState, useContext, useEffect } from 'react';
import { ThemeContext } from '../contexts/ThemeContext';
import { useParams, useNavigate } from 'react-router-dom';
import { getProjects } from '../services/projectApi';
import { getTasksByProject, getArchivedTasksByProject } from '../services/taskApi';
import { useSocket } from '../contexts/SocketContext';
import { getStoredUserInfo } from '../helpers/auth';
import { Lock, Globe } from 'lucide-react';
  
export default function Dashboard() {
  const { theme } = useContext(ThemeContext);
  const isDarkMode = theme === 'dark';
  const { workspaceId } = useParams();
  const navigate = useNavigate();

  const [timeRange, setTimeRange] = useState('This week');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const [userName, setUserName] = useState(() => {
    try {
      const rawUserInfo = localStorage.getItem('userInfo');
      const storedUserInfo = rawUserInfo ? JSON.parse(rawUserInfo) : null;
      return storedUserInfo?.name || storedUserInfo?.username || storedUserInfo?.fullName || 'User';
    } catch {
      return 'User';
    }
  });

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };
  const greeting = getGreeting();

  const { socket, isConnected } = useSocket();
  const currentUser = getStoredUserInfo();
  const currentUserId = currentUser?._id || currentUser?.id;

  useEffect(() => {
    if (!socket || !isConnected || !workspaceId) return;

    const handleProjectUpdatedSocket = async (payload) => {
      const updatedProject = payload.project;
      if (!updatedProject) return;

      // Make sure the project belongs to the current workspace
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

        // Also fetch tasks for the new project to populate the dashboard metrics!
        try {
          const [activeRes, archivedRes] = await Promise.all([
            getTasksByProject(updatedProject._id),
            getArchivedTasksByProject(updatedProject._id)
          ]);
          const projectTasks = [...(activeRes.tasks || []), ...(archivedRes.tasks || [])];
          setTasks((prev) => {
            // Remove existing tasks for this project, then add new ones
            const filtered = prev.filter(t => {
              const tProjId = t.project?._id || t.project;
              return String(tProjId) !== String(updatedProject._id);
            });
            return [...filtered, ...projectTasks];
          });
        } catch (err) {
          console.error("Failed to fetch tasks for project updates:", err);
        }
      } else {
        // Access revoked (e.g. removed from members list), filter out the project and its tasks
        setProjects((prev) => prev.filter((p) => p._id !== updatedProject._id));
        setTasks((prev) => prev.filter(t => {
          const tProjId = t.project?._id || t.project;
          return String(tProjId) !== String(updatedProject._id);
        }));
      }
    };

    socket.on("project:updated", handleProjectUpdatedSocket);

    return () => {
      socket.off("project:updated", handleProjectUpdatedSocket);
    };
  }, [socket, isConnected, workspaceId, currentUserId]);

  useEffect(() => {
    if (!workspaceId) {
      setIsLoading(false);
      return;
    }

    let isMounted = true;
    const fetchWorkspaceData = async () => {
      setIsLoading(true);
      try {
        const projectsData = await getProjects(workspaceId);
        const projectsList = projectsData.projects || [];

        // Fetch tasks for all projects in parallel
        const tasksPromises = projectsList.map(project =>
          Promise.all([
            getTasksByProject(project._id).then(res => res.tasks || []),
            getArchivedTasksByProject(project._id).then(res => res.tasks || [])
          ])
            .then(([active, archived]) => [...active, ...archived])
            .catch(err => {
              console.error(`Failed to fetch tasks for project ${project._id}:`, err);
              return [];
            })
        );

        const allTasksListArray = await Promise.all(tasksPromises);
        const allTasks = allTasksListArray.flat();

        if (isMounted) {
          setTasks(allTasks);
          setProjects(projectsList);
          setIsLoading(false);
        }
      } catch (error) {
        console.error("Error fetching workspace data:", error);
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchWorkspaceData();
    return () => {
      isMounted = false;
    };
  }, [workspaceId]);

  // Compute metrics dynamically from fetched tasks
  const getStartOfWeek = () => {
    const today = new Date();
    const day = today.getDay();
    const diff = today.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(today.setDate(diff));
    monday.setHours(0, 0, 0, 0);
    return monday;
  };

  const getStartDateForTimeRange = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    switch (timeRange) {
      case 'Today':
        return today;
      case 'This week':
        return getStartOfWeek();
      case 'This month': {
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        startOfMonth.setHours(0, 0, 0, 0);
        return startOfMonth;
      }
      case 'This quarter': {
        const quarterStartMonth = Math.floor(today.getMonth() / 3) * 3;
        const startOfQuarter = new Date(today.getFullYear(), quarterStartMonth, 1);
        startOfQuarter.setHours(0, 0, 0, 0);
        return startOfQuarter;
      }
      default:
        return getStartOfWeek();
    }
  };

  const getPreviousPeriodStartDate = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    switch (timeRange) {
      case 'Today': {
        const prev = new Date(today);
        prev.setDate(prev.getDate() - 1);
        return { start: prev, end: today };
      }
      case 'This week': {
        const currentStart = getStartOfWeek();
        const prevStart = new Date(currentStart);
        prevStart.setDate(prevStart.getDate() - 7);
        return { start: prevStart, end: currentStart };
      }
      case 'This month': {
        const currentStart = new Date(today.getFullYear(), today.getMonth(), 1);
        currentStart.setHours(0, 0, 0, 0);
        const prevStart = new Date(currentStart);
        prevStart.setMonth(prevStart.getMonth() - 1);
        return { start: prevStart, end: currentStart };
      }
      case 'This quarter': {
        const quarterStartMonth = Math.floor(today.getMonth() / 3) * 3;
        const currentStart = new Date(today.getFullYear(), quarterStartMonth, 1);
        currentStart.setHours(0, 0, 0, 0);
        const prevStart = new Date(currentStart);
        prevStart.setMonth(prevStart.getMonth() - 3);
        return { start: prevStart, end: currentStart };
      }
      default: {
        const currentStart = getStartOfWeek();
        const prevStart = new Date(currentStart);
        prevStart.setDate(prevStart.getDate() - 7);
        return { start: prevStart, end: currentStart };
      }
    }
  };

  const openTasksCount = tasks.filter(t => t.status !== 'done' && !t.isArchived).length;
  const openTasksCreatedInPeriod = tasks.filter(t => !t.isArchived && t.status !== 'done' && new Date(t.createdAt) >= getStartDateForTimeRange()).length;
  const openTasksTrend = `+${openTasksCreatedInPeriod} new`;

  const completedDateStart = getStartDateForTimeRange();
  const completedCountForRange = tasks.filter(t => {
    if (t.status !== 'done') return false;
    const completedDate = t.completedAt ? new Date(t.completedAt) : new Date(t.updatedAt);
    return completedDate >= completedDateStart;
  }).length;

  const prevPeriod = getPreviousPeriodStartDate();
  const prevCompletedCount = tasks.filter(t => {
    if (t.status !== 'done') return false;
    const completedDate = t.completedAt ? new Date(t.completedAt) : new Date(t.updatedAt);
    return completedDate >= prevPeriod.start && completedDate < prevPeriod.end;
  }).length;

  const completedDiff = completedCountForRange - prevCompletedCount;
  let completedTrend = "0%";
  if (prevCompletedCount > 0) {
    const pct = Math.round((completedDiff / prevCompletedCount) * 100);
    completedTrend = pct >= 0 ? `+${pct}%` : `${pct}%`;
  } else if (completedDiff > 0) {
    completedTrend = `+${completedDiff}`;
  } else if (completedDiff < 0) {
    completedTrend = `${completedDiff}`;
  }
  const completedTrendIsPositive = completedDiff >= 0;

  const overdueCount = tasks.filter(t => {
    if (t.status === 'done' || t.isArchived || !t.dueDate) return false;
    const dueDateEnd = new Date(t.dueDate);
    dueDateEnd.setHours(23, 59, 59, 999);
    return dueDateEnd < new Date();
  }).length;

  const prevOverdueCount = tasks.filter(t => {
    if (t.status === 'done' || t.isArchived || !t.dueDate) return false;
    const dueDateEnd = new Date(t.dueDate);
    dueDateEnd.setHours(23, 59, 59, 999);
    return dueDateEnd < completedDateStart;
  }).length;

  const overdueDiff = overdueCount - prevOverdueCount;
  const overdueTrend = overdueDiff > 0 ? `+${overdueDiff}` : overdueDiff < 0 ? `${overdueDiff}` : '0';
  const overdueTrendIsPositive = overdueDiff <= 0;

  const totalTasksCount = tasks.length;
  const completedTasksCount = tasks.filter(t => t.status === 'done').length;
  const completionRate = totalTasksCount > 0 ? ((completedTasksCount / totalTasksCount) * 10).toFixed(1) : '0.0';

  const prevTotalTasksCount = tasks.filter(t => new Date(t.createdAt) < completedDateStart).length;
  const prevCompletedTasksCount = tasks.filter(t => {
    if (t.status !== 'done') return false;
    const completedDate = t.completedAt ? new Date(t.completedAt) : new Date(t.updatedAt);
    return completedDate < completedDateStart;
  }).length;

  const prevCompletionRate = prevTotalTasksCount > 0 ? ((prevCompletedTasksCount / prevTotalTasksCount) * 10).toFixed(1) : '0.0';
  const velocityDiff = (parseFloat(completionRate) - parseFloat(prevCompletionRate)).toFixed(1);
  const velocityTrend = parseFloat(velocityDiff) >= 0 ? `+${velocityDiff}` : `${velocityDiff}`;
  const velocityTrendIsPositive = parseFloat(velocityDiff) >= 0;

  const metrics = [
    {
      label: 'Open tasks',
      value: String(openTasksCount),
      trend: openTasksTrend,
      isPositive: true,
      iconBg: 'bg-blue-500/10 text-blue-500 dark:bg-blue-500/15',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
        </svg>
      )
    },
    {
      label: 'Completed tasks',
      value: String(completedCountForRange),
      trend: completedTrend,
      isPositive: completedTrendIsPositive,
      iconBg: 'bg-emerald-500/10 text-emerald-500 dark:bg-emerald-500/15',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    },
    {
      label: 'Overdue',
      value: String(overdueCount),
      trend: overdueTrend,
      isPositive: overdueTrendIsPositive,
      iconBg: 'bg-amber-500/10 text-amber-500 dark:bg-amber-500/15',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    },
    {
      label: 'Team velocity',
      value: String(completionRate),
      trend: velocityTrend,
      isPositive: velocityTrendIsPositive,
      iconBg: 'bg-indigo-500/10 text-indigo-500 dark:bg-indigo-500/15',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
        </svg>
      )
    }
  ];

  // Formatting helper for project end dates
  const formatProjectDate = (dateStr) => {
    if (!dateStr) return 'No deadline';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  // Helper to extract user initials
  const getInitials = (name) => {
    if (!name) return "?";
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return parts[0].slice(0, 2).toUpperCase();
  };

  // Calculate activeProjects dynamically
  const activeProjects = projects.filter(p => !p.isArchived).map(project => {
    const projectTasks = tasks.filter(t => {
      const projId = t.project?._id || t.project;
      return projId?.toString() === project._id.toString();
    });

    const totalTasks = projectTasks.length;
    const completedTasks = projectTasks.filter(t => t.status === 'done').length;
    const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    const assigneesSet = new Set();
    projectTasks.forEach(t => {
      if (t.assignedTo && Array.isArray(t.assignedTo)) {
        t.assignedTo.forEach(u => {
          const name = u.username || u.name || '';
          if (name) {
            assigneesSet.add(getInitials(name));
          }
        });
      }
    });
    const assignees = Array.from(assigneesSet).slice(0, 3);
    if (assignees.length === 0) {
      assignees.push('T'); // Default placeholder initials for "Team"
    }

    return {
      _id: project._id,
      name: project.name,
      dueDate: formatProjectDate(project.sprintEndDate),
      assignees,
      progress,
      visibility: project.visibility
    };
  });

  // Calculate upcomingDeadlines dynamically
  const upcomingDeadlines = tasks
    .filter(t => t.status !== 'done' && !t.isArchived && t.dueDate)
    .filter(t => {
      const due = new Date(t.dueDate);
      due.setHours(23, 59, 59, 999);
      return due >= new Date();
    })
    .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
    .slice(0, 4)
    .map(t => {
      const date = new Date(t.dueDate);
      const day = date.getDate();
      const monthObj = date.toLocaleString('en-US', { month: 'short' }).toUpperCase();
      const timeStr = date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
      const formattedTime = timeStr === '12:00 AM' || timeStr === '00:00' ? 'End of day' : timeStr;

      return {
        day: String(day),
        month: monthObj,
        title: t.title,
        time: formattedTime
      };
    });

  // Helper for priority displaying
  const getPriorityDisplay = (priority) => {
    switch (priority?.toLowerCase()) {
      case 'high':
        return {
          label: 'High',
          color: 'bg-rose-500/10 text-rose-500 border-slate-200 dark:border-slate-800'
        };
      case 'medium':
        return {
          label: 'Med',
          color: 'bg-amber-500/10 text-amber-500 border-slate-200 dark:border-slate-800'
        };
      case 'low':
      default:
        return {
          label: 'Low',
          color: 'bg-emerald-500/10 text-emerald-500 border-slate-200 dark:border-slate-800'
        };
    }
  };

  // Click handler to open the board view where the task resides
  const handleTaskClick = (task) => {
    const projId = task.project?._id || task.project;
    if (workspaceId && projId) {
      navigate(`/workspaces/${workspaceId}/projects/${projId}`);
    }
  };

  // Sort tasks by smartPriorityScore descending (only uncompleted)
  const sortedPriorityTasks = [...tasks]
    .filter(task => task.status !== 'done' && !task.isArchived)
    .sort((a, b) => (b.smartPriorityScore || 0) - (a.smartPriorityScore || 0));

  // Compute through-put data for the chart

  const getWeeklyThroughputData = () => {
    const startOfWeek = getStartOfWeek();
    const createdCounts = Array(7).fill(0);
    const completedCounts = Array(7).fill(0);

    tasks.forEach(task => {
      const createdDate = new Date(task.createdAt);
      const createdDiff = Math.floor((createdDate - startOfWeek) / (1000 * 60 * 60 * 24));
      if (createdDiff >= 0 && createdDiff < 7) {
        createdCounts[createdDiff]++;
      }

      if (task.status === 'done') {
        const completedDate = task.completedAt ? new Date(task.completedAt) : new Date(task.updatedAt);
        const completedDiff = Math.floor((completedDate - startOfWeek) / (1000 * 60 * 60 * 24));
        if (completedDiff >= 0 && completedDiff < 7) {
          completedCounts[completedDiff]++;
        }
      }
    });

    return { createdCounts, completedCounts };
  };

  const { createdCounts, completedCounts } = getWeeklyThroughputData();
  const maxVal = Math.max(...createdCounts, ...completedCounts, 4);

  const generateSvgPath = (counts, maxVal) => {
    const points = counts.map((v, i) => {
      const x = 10 + i * 100;
      const y = 170 - (v / maxVal) * 140;
      return { x, y };
    });

    const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
    const areaPath = `${linePath} L 610 170 L 10 170 Z`;

    return { linePath, areaPath };
  };

  const createdPaths = generateSvgPath(createdCounts, maxVal);
  const donePaths = generateSvgPath(completedCounts, maxVal);

  if (isLoading) {
    return (
      <div className={`w-full h-full flex flex-col p-6 md:p-8 transition-colors duration-300 animate-pulse ${isDarkMode ? 'bg-[#090D16] text-white' : 'bg-slate-50 text-slate-800'
        }`}>
        <div className="h-10 w-48 bg-slate-300 dark:bg-slate-800 rounded-xl mb-8"></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-28 bg-slate-300 dark:bg-slate-800 rounded-2xl"></div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1">
          <div className="lg:col-span-2 h-72 bg-slate-300 dark:bg-slate-800 rounded-2xl"></div>
          <div className="h-72 bg-slate-300 dark:bg-slate-800 rounded-2xl"></div>
        </div>
      </div>
    );
  }

  return (
    <div className={`w-full h-full flex flex-col min-h-0 overflow-auto p-6 md:p-8 transition-colors duration-300 ${isDarkMode ? 'bg-[#090D16] text-white' : 'bg-slate-50 text-slate-800'
      }`}>

      {/* 1. HEADER ROW */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 shrink-0">
        <div>
          <h1 className="text-2xl md:text-3xl font-medium tracking-tight">{greeting}, {userName}</h1>
          <p className={`text-xs md:text-sm mt-1.5 font-normal ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
            Here's what's happening across your workspace today.
          </p>
        </div>

        {/* Time Selector Dropdown */}
        <div className="relative">
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className={`inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl border transition-all ${isDarkMode
                ? 'bg-slate-900 border-slate-800 hover:bg-slate-850 text-slate-200'
                : 'bg-white border-slate-200 hover:bg-slate-100 text-slate-700 shadow-sm'
              }`}
          >
            {timeRange}
            <svg className={`w-3.5 h-3.5 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {isDropdownOpen && (
            <div className={`absolute right-0 mt-1.5 w-36 rounded-xl border shadow-xl z-50 overflow-hidden ${isDarkMode 
                ? 'bg-slate-900 border-slate-800' 
                : 'bg-white border-slate-200'
              }`}>
              {['Today', 'This week', 'This month', 'This quarter'].map((range) => (
                <button
                  key={range}
                  onClick={() => {
                    setTimeRange(range);
                    setIsDropdownOpen(false);
                  }}
                  className={`w-full text-left px-4 py-2.5 text-xs font-semibold transition-colors ${isDarkMode ? 'hover:bg-slate-800 text-slate-350' : 'hover:bg-slate-50 text-slate-650'
                    }`}
                >
                  {range}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 2. METRICS ROW */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8 shrink-0">
        {metrics.map((m, idx) => (
          <div
            key={idx}
            className={`border rounded-2xl p-5 flex flex-col justify-between shadow-sm hover:shadow-md transition-all ${isDarkMode 
                ? 'bg-[#1F1F23]/40 border-slate-800' 
                : 'bg-white border-slate-200'
              }`}
          >
            <div className="flex items-center justify-between">
              <span className={`text-sm font-normal  ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                {m.label}
              </span>
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${m.iconBg}`}>
                {m.icon}
              </div>
            </div>

            <div className="flex items-baseline gap-2 mt-4">
              <span className="text-2xl md:text-3xl font-medium tracking-tight">{m.value}</span>
              <span className={`text-xs font-normal ${
                m.isPositive
                  ? 'text-emerald-500 dark:text-emerald-400'
                  : 'text-rose-500 dark:text-rose-450'
              }`}>
                {m.trend}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* 3. SPLIT GRAPH & PRIORITY GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch shrink-0">

        {/* Left Column: Throughput SVG Curve Chart */}
        <div className={`lg:col-span-2 border rounded-2xl p-5 md:p-6 flex flex-col justify-between shadow-sm min-h-[350px] ${isDarkMode 
            ? 'bg-[#1F1F23]/40 border-slate-800' 
            : 'bg-white border-slate-200'
          }`}>
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <h3 className="text-base font-medium tracking-tight">Throughput</h3>

              {/* Legends */}
              <div className="flex items-center gap-4 text-[11px] font-medium text-slate-450">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#6366F1]" />
                  <span>Done</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-slate-400" />
                  <span>Created</span>
                </div>
              </div>
            </div>
            <p className={`text-[11px] font-normal ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
              Tasks created vs completed
            </p>
          </div>

          {/* Curve Graphic Area */}
          <div className="flex-1 min-h-[180px] w-full relative mt-6 flex flex-col justify-between">
            {/* Horizontal Grid lines */}
            <div className="absolute inset-0 flex flex-col justify-between py-1 pointer-events-none opacity-40">
              {[maxVal, Math.round(maxVal * 0.75), Math.round(maxVal * 0.5), Math.round(maxVal * 0.25), 0].map((val, i) => (
                <div key={i} className="flex items-center w-full gap-3">
                  <span className="text-[10px] font-bold text-slate-450 w-4 text-right shrink-0">{val}</span>
                  <div className="flex-1 border-t border-dashed border-slate-200 dark:border-slate-800" />
                </div>
              ))}
            </div>

            {/* SVG Interactive Canvas */}
            <div className="flex-1 w-full relative pl-7 pr-4 z-10 select-none">
              <svg
                className="w-full h-full"
                viewBox="0 0 650 180"
                preserveAspectRatio="none"
              >
                <defs>
                  {/* "Done" (Blue) Area Gradient */}
                  <linearGradient id="doneGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6366F1" stopOpacity="0.18" />
                    <stop offset="100%" stopColor="#6366F1" stopOpacity="0.0" />
                  </linearGradient>

                  {/* "Created" (Slate) Area Gradient */}
                  <linearGradient id="createdGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#94A3B8" stopOpacity="0.12" />
                    <stop offset="100%" stopColor="#94A3B8" stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                {/* --- PATH 1: CREATED (Slate Line) --- */}
                <path
                  d={createdPaths.areaPath}
                  fill="url(#createdGradient)"
                />
                <path
                  d={createdPaths.linePath}
                  fill="none"
                  stroke={isDarkMode ? '#64748B' : '#94A3B8'}
                  strokeWidth="2"
                  strokeLinecap="round"
                />

                {/* --- PATH 2: DONE (Blue Line) --- */}
                <path
                  d={donePaths.areaPath}
                  fill="url(#doneGradient)"
                />
                <path
                  d={donePaths.linePath}
                  fill="none"
                  stroke="#6366F1"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
              </svg>
            </div>

            {/* X-Axis Labels */}
            <div className="flex justify-between items-center pl-7 pr-4 mt-2 shrink-0">
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
                <span key={day} className="text-[10px] font-bold text-slate-450">{day}</span>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Smart Priority List */}
        <div className={`border rounded-2xl p-5 md:p-6 flex flex-col justify-between shadow-sm min-h-[350px] ${isDarkMode 
            ? 'bg-[#1F1F23]/40 border-slate-800' 
            : 'bg-white border-slate-200'
          }`}>
          <div>
            <div className="flex items-center gap-2 mb-1.5 text-indigo-400">
              {/* Sparkle Icon */}
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 21L8.188 15.904L3 15L8.188 14.096L9 9L9.813 14.096L15 15L9.813 15.904Z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.071 4.929a10 10 0 00-14.142 0M19.071 19.071a10 10 0 000-14.142" />
              </svg>
              <h3 className="text-base font-medium tracking-tight text-slate-900 dark:text-white">Smart priority</h3>
            </div>
            <p className={`text-[11px] font-normal ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
              Suggested order based on deadlines and effort.
            </p>
          </div>

          {/* List Wrapper */}
          <div className="flex-1 mt-6 flex flex-col gap-3 overflow-y-auto max-h-[250px] pr-1">
            {sortedPriorityTasks.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center py-8">
                <p className="text-xs font-medium text-slate-450 dark:text-slate-550">
                  No active tasks to prioritize!
                </p>
                <p className="text-[10px] text-slate-400 mt-1">
                  Create tasks in your board and they will appear here.
                </p>
              </div>
            ) : (
              sortedPriorityTasks.slice(0, 5).map((t) => {
                const priorityInfo = getPriorityDisplay(t.priority);
                return (
                  <div
                    key={t._id}
                    onClick={() => handleTaskClick(t)}
                    className={`flex items-center justify-between px-4.5 py-3.5 border rounded-xl hover:scale-[1.01] transition-all cursor-pointer ${isDarkMode
                        ? 'bg-slate-950/20 border-slate-800 hover:bg-slate-900/60'
                        : 'bg-slate-50 border-slate-200 hover:bg-slate-100 shadow-sm'
                      }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />
                      <span className="text-xs font-bold truncate leading-none text-slate-800 dark:text-slate-200">
                        {t.title}
                      </span>
                    </div>

                    <span className={`text-[10px] font-bold px-2.5 py-0.5 border rounded-md uppercase tracking-wider shrink-0 ${priorityInfo.color}`}>
                      {priorityInfo.label}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>

      </div>

      {/* 4. ACTIVE PROJECTS & UPCOMING DEADLINES GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6 shrink-0 pb-2">
        
        {/* Left Column: Active Projects */}
        <div className={`lg:col-span-2 border rounded-2xl p-5 md:p-6 flex flex-col justify-between shadow-sm ${
          isDarkMode ? 'bg-[#1F1F23]/40 border-slate-800' : 'bg-white border-slate-200'
        }`}>
          <div>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-sm font-medium tracking-tight">Active projects</h3>
            </div>

            <div className="flex flex-col gap-6 mt-4">
              {activeProjects.length === 0 ? (
                <div className="text-center py-6 text-xs text-slate-450">
                  No active projects found.
                </div>
              ) : (
                activeProjects.map((p, idx) => (
                  <div key={idx} className="flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-xs font-bold truncate">{p.name}</span>
                        {p.visibility === 'private' ? (
                          <span className={`px-1.5 py-0.5 rounded-md border shrink-0 flex items-center justify-center ${isDarkMode ? 'bg-amber-950/30 text-amber-400 border-slate-800' : 'bg-amber-50 text-amber-650 border-slate-200'}`} title="Private">
                            <Lock className="h-3 w-3" />
                          </span>
                        ) : (
                          <span className={`px-1.5 py-0.5 rounded-md border shrink-0 flex items-center justify-center ${isDarkMode ? 'bg-slate-900/60 text-slate-400 border-slate-800' : 'bg-slate-100 text-slate-500 border-slate-200'}`} title="Workspace">
                            <Globe className="h-3 w-3" />
                          </span>
                        )}
                        <span className="text-[10px] text-slate-400 font-medium shrink-0">{p.dueDate}</span>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        {/* Overlapping User Avatars */}
                        <div className="flex -space-x-1.5 overflow-hidden">
                          {p.assignees.map((assignee, aIdx) => (
                            <div 
                              key={aIdx} 
                              className={`w-5.5 h-5.5 rounded-full border text-[8px] font-black flex items-center justify-center ${
                                isDarkMode 
                                  ? 'bg-slate-800 border-slate-800 text-slate-300' 
                                  : 'bg-slate-100 border-slate-200 text-slate-600'
                              }`}
                            >
                              {assignee}
                            </div>
                          ))}
                        </div>

                        <span className="text-xs font-bold min-w-[28px] text-right">{p.progress}%</span>
                      </div>
                    </div>

                    {/* Progress Bar Track */}
                    <div className={`w-full h-1.5 rounded-full overflow-hidden ${
                      isDarkMode ? 'bg-slate-800' : 'bg-slate-100'
                    }`}>
                      <div 
                        className="h-full bg-[#6366F1] rounded-full transition-all duration-500" 
                        style={{ width: `${p.progress}%` }} 
                      />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Upcoming Deadlines */}
        <div className={`border rounded-2xl p-5 md:p-6 flex flex-col justify-between shadow-sm ${
          isDarkMode ? 'bg-[#1F1F23]/40 border-slate-800' : 'bg-white border-slate-200'
        }`}>
          <div>
            <h3 className="text-base font-medium tracking-tight mb-4">Upcoming deadlines</h3>
            
            <div className="flex flex-col gap-4 mt-2">
              {upcomingDeadlines.length === 0 ? (
                <div className="text-center font-normal py-6 text-xs text-slate-400">
                  No upcoming deadlines.
                </div>
              ) : (
                upcomingDeadlines.map((d, idx) => (
                  <div key={idx} className="flex items-center gap-4">
                    {/* Calendar Badge */}
                    <div className={`w-12 h-14 rounded-xl flex flex-col items-center justify-center shrink-0 border ${
                      isDarkMode 
                        ? 'bg-slate-900/60 border-slate-800 text-slate-200' 
                        : 'bg-slate-100 border-slate-200 text-slate-800'
                    }`}>
                      <span className="text-sm font-extrabold tracking-tight leading-none">{d.day}</span>
                      <span className="text-[9px] font-bold text-slate-400 mt-1 uppercase tracking-wider">{d.month}</span>
                    </div>

                    {/* Deadline text items */}
                    <div className="min-w-0">
                      <h4 className="text-xs font-bold truncate text-slate-900 dark:text-white">{d.title}</h4>
                      <p className="text-[10px] font-medium text-slate-450 mt-1">{d.time}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}