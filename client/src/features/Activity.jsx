import React, { useState, useMemo, useEffect, useRef, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getProjects } from '../services/projectApi';
import { getActivities } from '../services/activityApi';
import { getStoredUserInfo } from '../helpers/auth';
import { ThemeContext } from '../contexts/ThemeContext';
import { useSocket } from '../contexts/SocketContext';

const getInitials = (name = "") => {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();
};

const getAvatarColor = (username) => {
  const colors = [
    'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400',
    'bg-blue-50 text-blue-650 dark:bg-blue-950/40 dark:text-blue-400',
    'bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400',
    'bg-purple-50 text-purple-650 dark:bg-purple-950/40 dark:text-purple-400',
    'bg-rose-50 text-rose-500 dark:bg-rose-950/20 dark:text-rose-400',
  ];
  let sum = 0;
  for (let i = 0; i < username.length; i++) {
    sum += username.charCodeAt(i);
  }
  return colors[sum % colors.length];
};

const getDayGroup = (dateValue) => {
  const d = new Date(dateValue);
  const now = new Date();
  
  const isSameDay = (d1, d2) => 
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate();
    
  if (isSameDay(d, now)) {
    return 'TODAY';
  }
  
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (isSameDay(d, yesterday)) {
    return 'YESTERDAY';
  }
  
  return 'OLDER';
};

const formatRelativeTime = (dateValue) => {
  if (!dateValue) return 'Just now';
  
  const date = new Date(dateValue);
  const diffInMinutes = Math.floor((Date.now() - date.getTime()) / 60000);
  
  if (diffInMinutes < 1) return 'Just now';
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}h ago`;
  
  const diffInDays = Math.floor(diffInHours / 24);
  return `${diffInDays}d ago`;
};

const mapActivityToEvent = (activity) => {
  const user = activity.isSystemActor
    ? {
        name: activity.systemActorName || 'System',
        initials: getInitials(activity.systemActorName || 'System'),
        avatarBg: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
      }
    : activity.actor
      ? {
          name: activity.actor.username || 'Unknown User',
          initials: getInitials(activity.actor.username || 'Unknown'),
          avatarBg: getAvatarColor(activity.actor.username || '')
        }
      : {
          name: 'Unknown User',
          initials: '??',
          avatarBg: 'bg-slate-100 text-slate-650'
        };

  // Map type to action and badge
  let action = '';
  let badge = null;
  let comment = undefined;
  let tag = undefined;
  let assignee = undefined;

  switch (activity.type) {
    case 'task_completed':
      action = 'completed';
      badge = {
        color: 'bg-emerald-50 border border-emerald-250 text-emerald-600 dark:bg-emerald-950/40 dark:border-emerald-850 dark:text-emerald-400',
        icon: (
          <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" strokeWidth="3.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        )
      };
      break;
    case 'comment_added':
      action = 'commented on';
      comment = activity.content;
      badge = {
        color: 'bg-blue-50 border border-blue-200 text-blue-600 dark:bg-blue-950/40 dark:border-blue-800 dark:text-blue-400',
        icon: (
          <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        )
      };
      break;
    case 'reminder_sent':
      action = 'sent reminder for';
      if (activity.sourceBadge) {
        tag = {
          label: activity.sourceBadge,
          style: 'bg-rose-50 text-rose-500 border border-rose-100 dark:bg-rose-950/20 dark:text-rose-400 dark:border-rose-900/30'
        };
      }
      badge = {
        color: 'bg-rose-50 border border-rose-250 text-rose-550 dark:bg-rose-950/40 dark:border-rose-850 dark:text-rose-455',
        icon: (
          <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
        )
      };
      break;
    case 'task_assigned':
      action = 'assigned';
      assignee = activity.recipient ? (activity.recipient.username || 'someone') : 'someone';
      badge = {
        color: 'bg-amber-50 border border-amber-250 text-amber-600 dark:bg-amber-950/40 dark:border-amber-850 dark:text-amber-450',
        icon: (
          <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
          </svg>
        )
      };
      break;
    case 'task_created':
      action = 'created task';
      badge = {
        color: 'bg-indigo-50 border border-indigo-250 text-indigo-655 dark:bg-indigo-950/40 dark:border-indigo-850 dark:text-indigo-400',
        icon: (
          <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
        )
      };
      break;
    case 'task_updated':
      action = 'updated task';
      badge = {
        color: 'bg-slate-50 border border-slate-255 text-slate-650 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-400',
        icon: (
          <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        )
      };
      break;
    case 'status_changed':
      const newStatus = activity.metadata?.newStatus || 'updated status';
      action = `changed status to "${newStatus}" of`;
      badge = {
        color: 'bg-teal-50 border border-teal-250 text-teal-650 dark:bg-teal-950/40 dark:border-teal-850 dark:text-teal-400',
        icon: (
          <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
          </svg>
        )
      };
      break;
    case 'member_joined':
      action = 'joined workspace';
      badge = {
        color: 'bg-violet-50 border border-violet-250 text-violet-650 dark:bg-violet-950/40 dark:border-violet-850 dark:text-violet-400',
        icon: (
          <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
          </svg>
        )
      };
      break;
    case 'project_created':
      action = 'created project';
      badge = {
        color: 'bg-pink-50 border border-pink-250 text-pink-600 dark:bg-pink-950/40 dark:border-pink-850 dark:text-pink-400',
        icon: (
          <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        )
      };
      break;
    default:
      action = activity.type.replace('_', ' ');
      badge = {
        color: 'bg-slate-50 border border-slate-200 text-slate-650 dark:bg-slate-900 dark:border-slate-850 dark:text-slate-400',
        icon: null
      };
  }

  const currentUser = getStoredUserInfo();
  const currentUserId = currentUser?._id || currentUser?.id;
  const isMention = activity.recipient && String(activity.recipient._id || activity.recipient) === String(currentUserId);

  return {
    id: activity._id,
    type: activity.type,
    dayGroup: getDayGroup(activity.createdAt),
    timestamp: new Date(activity.createdAt).getTime(),
    timeString: formatRelativeTime(activity.createdAt),
    user,
    action,
    target: activity.targetTitle,
    comment,
    tag,
    assignee,
    isMention
  };
};

export default function Activity() {
  const { theme } = useContext(ThemeContext);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState([]);
  const [activeProject, setActiveProject] = useState(null); // null means All Projects
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'mentions'
  const [searchQuery, setSearchQuery] = useState('');
  const [isWorkspaceDropdownOpen, setIsWorkspaceDropdownOpen] = useState(false);
  const [toasts, setToasts] = useState([]);

  const { workspaceId } = useParams();
  const navigate = useNavigate();
  const workspaceRef = useRef(null);

  const { socket, isConnected, joinWorkspace, leaveWorkspace } = useSocket();

  // Join workspace socket room
  useEffect(() => {
    if (!socket || !isConnected || !workspaceId) return;

    let isMounted = true;
    joinWorkspace(workspaceId).then((response) => {
      if (!isMounted) {
        leaveWorkspace(workspaceId);
      } else if (response?.success === false) {
        console.error("Failed to join workspace socket room:", response.message);
      }
    });

    return () => {
      isMounted = false;
      leaveWorkspace(workspaceId);
    };
  }, [socket, isConnected, workspaceId, joinWorkspace, leaveWorkspace]);

  // Listen for real-time activity updates
  useEffect(() => {
    if (!socket || !workspaceId) return;

    const handleActivityCreated = (payload) => {
      const newActivity = payload.activity;
      if (!newActivity) return;

      // Check if it belongs to the current workspace
      const actWorkspaceId = newActivity.workspace?._id || newActivity.workspace;
      if (String(actWorkspaceId) !== String(workspaceId)) return;

      // Check if active project filter is active and matches
      if (activeProject) {
        const actProjectId = newActivity.project?._id || newActivity.project;
        if (String(actProjectId) !== String(activeProject._id)) return;
      }

      // Prepend to our events list
      setEvents((prev) => {
        // Prevent duplicate activities
        const exists = prev.some((e) => e.id === newActivity._id);
        if (exists) return prev;
        
        const mapped = mapActivityToEvent(newActivity);
        return [mapped, ...prev];
      });
    };

    socket.on("activity:created", handleActivityCreated);

    return () => {
      socket.off("activity:created", handleActivityCreated);
    };
  }, [socket, workspaceId, activeProject]);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (workspaceRef.current && !workspaceRef.current.contains(event.target)) {
        setIsWorkspaceDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const addToast = (message, type = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3500);
  };

  // Fetch projects inside the current workspace
  useEffect(() => {
    if (!workspaceId) return;
    const fetchProjectsData = async () => {
      try {
        const data = await getProjects(workspaceId);
        setProjects(data.projects || []);
      } catch (err) {
        console.error("Failed to fetch projects:", err);
      }
    };
    fetchProjectsData();
  }, [workspaceId]);

  // Fetch activities
  useEffect(() => {
    if (!workspaceId) return;
    const fetchActivitiesData = async () => {
      setLoading(true);
      try {
        const params = {};
        if (activeProject) {
          params.project = activeProject._id;
        }
        const data = await getActivities(workspaceId, params);
        if (data && data.activities) {
          const mapped = data.activities.map(mapActivityToEvent);
          setEvents(mapped);
        } else {
          setEvents([]);
        }
      } catch (err) {
        console.error("Failed to fetch activities:", err);
        addToast("Error fetching activity feed.", "error");
      } finally {
        setLoading(false);
      }
    };
    fetchActivitiesData();
  }, [workspaceId, activeProject]);

  // Process lists with search filters and active category toggles
  const processedEvents = useMemo(() => {
    return events.filter(event => {
      // 1. Tab filtration
      if (activeTab === 'mentions' && !event.isMention) return false;

      // 2. Text Search filtration
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesUser = event.user.name.toLowerCase().includes(query);
        const matchesTarget = event.target.toLowerCase().includes(query);
        const matchesComment = event.comment && event.comment.toLowerCase().includes(query);
        const matchesAction = event.action.toLowerCase().includes(query);
        return matchesUser || matchesTarget || matchesComment || matchesAction;
      }
      return true;
    });
  }, [events, activeTab, searchQuery]);

  // Split event pools into visual day hierarchies
  const todayPool = useMemo(() => processedEvents.filter(e => e.dayGroup === 'TODAY'), [processedEvents]);
  const yesterdayPool = useMemo(() => processedEvents.filter(e => e.dayGroup === 'YESTERDAY'), [processedEvents]);
  const olderPool = useMemo(() => processedEvents.filter(e => e.dayGroup === 'OLDER'), [processedEvents]);

  // Unified visual item component strictly structured matching screenshot
  const renderEventItem = (event, index, poolLength) => {
    return (
      <div key={event.id} className="relative flex gap-4 md:gap-6 pb-8 last:pb-0 group">
        
        {/* Vertical connecting line */}
        {index !== poolLength - 1 && (
          <div className={`absolute left-[20px] top-[40px] bottom-0 w-[1.5px] ${
            theme === 'dark' ? 'bg-slate-800' : 'bg-slate-100'
          }`} />
        )}

        {/* Avatar bubble with overlapping badge */}
        <div className="relative shrink-0 z-10">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs ${event.user.avatarBg}`}>
            {event.user.initials}
          </div>
          {event.badge && event.type !== 'comment_added' && (
            <div className={`absolute -bottom-1 -right-1 w-4.5 h-4.5 rounded-full flex items-center justify-center shadow-sm border-2 ${
              theme === 'dark' ? 'border-[#12141a]' : 'border-white'
            } ${event.badge.color}`}>
              {event.badge.icon}
            </div>
          )}
        </div>

        {/* Content text section */}
        <div className="flex-1 min-w-0 pt-1.5">
          <div className="text-xs md:text-sm leading-relaxed text-slate-500 dark:text-slate-400">
            <span className="font-semibold text-slate-800 dark:text-slate-100 hover:text-[#6366F1] transition-colors cursor-pointer mr-1.5">
              {event.user.name}
            </span>
            <span className="text-slate-450 dark:text-slate-500 font-normal mr-1.5">
              {event.action}
            </span>
            <span className="font-semibold text-slate-800 dark:text-slate-100 hover:text-[#6366F1] transition-colors cursor-pointer mr-1.5">
              {event.target}
            </span>
            {event.assignee && (
              <span className="text-slate-450 dark:text-slate-505 font-normal">
                to <span className="font-semibold text-slate-800 dark:text-slate-100 hover:text-[#6366F1] transition-colors cursor-pointer ml-1">{event.assignee}</span>
              </span>
            )}
          </div>

          {/* Comment Bubble text box */}
          {event.comment && (
            <div className={`mt-2 px-5 py-3 rounded-2xl border text-xs leading-relaxed max-w-2xl transition-colors ${
              theme === 'dark' 
                ? 'bg-slate-950/30 border-slate-800/80 text-slate-350' 
                : 'bg-slate-50 border-slate-200/60 text-slate-650'
            }`}>
              {event.comment}
            </div>
          )}

          {/* Footer details row */}
          <div className="flex items-center gap-2 mt-2">
            {(() => {
              if (event.type === 'comment_added') {
                return (
                  <div className="flex items-center justify-center w-5 h-5 rounded-full bg-blue-50/50 border border-blue-200/80 text-blue-500 dark:bg-blue-950/40 dark:border-blue-900/40 dark:text-blue-400 shrink-0">
                    <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  </div>
                );
              }
              if (event.type === 'reminder_sent') {
                return (
                  <div className="flex items-center justify-center w-5 h-5 rounded-full bg-rose-50/50 border border-rose-200/80 text-rose-500 dark:bg-rose-950/40 dark:border-rose-900/40 dark:text-rose-450 shrink-0">
                    <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                    </svg>
                  </div>
                );
              }
              if (event.type === 'task_assigned') {
                return (
                  <div className="flex items-center justify-center w-5 h-5 rounded-full bg-amber-50/50 border border-amber-200/80 text-amber-500 dark:bg-amber-950/40 dark:border-amber-900/40 dark:text-amber-450 shrink-0">
                    <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                    </svg>
                  </div>
                );
              }
              return null;
            })()}
            <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500">
              {event.timeString}
            </span>
            {event.tag && (
              <span className={`text-[9px] font-bold px-2 py-0.5 rounded-md ${event.tag.style}`}>
                {event.tag.label}
              </span>
            )}
          </div>
        </div>

      </div>
    );
  };

  return (
    <div className={`w-full h-full flex flex-col min-h-0 overflow-y-auto font-sans antialiased transition-colors duration-300 ${
      theme === 'dark' ? 'bg-[#090D16] text-slate-100' : 'bg-slate-50 text-slate-900'
    }`}>
      
      {/* GLOBAL TOAST POPUPS OVERLAYS */}
      <div className="fixed top-5 right-5 z-50 flex flex-col gap-2.5">
        {toasts.map(t => (
          <div key={t.id} className="flex items-center gap-2.5 bg-[#1F1F23] text-indigo-400 text-xs font-semibold px-4 py-3 rounded-xl shadow-2xl border border-slate-800/80 animate-fade-in animate-bounce">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-ping" />
            <span>{t.message}</span>
          </div>
        ))}
      </div>

      {/* MAIN TWO-COLUMN LAYOUT PANEL */}
      <div className="flex-1 flex flex-col lg:flex-row w-full max-w-[1300px] mx-auto p-4 md:p-8 gap-8 items-start">
        
        {/* LEFT COLUMN: ACTIVE FEED TIMELINE */}
        <div className="flex-1 w-full space-y-6">
          
          {/* TITLE & HEADER CONTROLS */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-semibold tracking-tight">Activity Timeline</h1>
              <p className={`text-xs md:text-sm mt-1.5 font-normal ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                Every action across your workspace, in one feed.
              </p>
            </div>

            {/* Filter Toggle Buttons conforming strictly to image_eb38a6.png */}
            <div className={`flex rounded-xl p-1 text-xs font-semibold shrink-0 ${
              theme === 'dark' ? 'bg-slate-900' : 'bg-white shadow-sm border border-slate-200/90'
            }`}>
              <button
                onClick={() => {
                  setActiveTab('all');
                  addToast('Showing all recent system actions.');
                }}
                className={`px-4.5 py-2 rounded-lg transition-all ${
                  activeTab === 'all'
                    ? theme === 'dark' 
                      ? 'bg-slate-800 text-white shadow-sm' 
                      : 'bg-slate-100 text-slate-900 border border-slate-200/50'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
                }`}
              >
                All activity
              </button>
              <button
                onClick={() => {
                  setActiveTab('mentions');
                  addToast('Showing peer comment mention feeds.');
                }}
                className={`px-4.5 py-2 rounded-lg transition-all ${
                  activeTab === 'mentions'
                    ? theme === 'dark' 
                      ? 'bg-slate-800 text-white shadow-sm' 
                      : 'bg-slate-100 text-slate-900 border border-slate-200/50'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
                }`}
              >
                Mentions
              </button>
            </div>
          </div>

          {/* ACTIVE PROJECT SWITCHER & SEARCH BAR */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 z-20">
            <div ref={workspaceRef} className="relative inline-block z-20">
              <button
                onClick={() => setIsWorkspaceDropdownOpen(!isWorkspaceDropdownOpen)}
                className={`flex items-center gap-2 border rounded-xl px-4 py-2.5 text-xs font-bold transition-all ${
                  theme === 'dark'
                    ? 'bg-[#1F1F23]/60 border-slate-800 text-slate-200 hover:bg-slate-800'
                    : 'bg-white border-slate-200/90 text-slate-700 hover:bg-slate-50 shadow-sm'
                }`}
              >
                <svg className="w-3.5 h-3.5 text-indigo-500" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20 6h-4V4c0-1.11-.89-2-2-2h-4c-1.11 0-2 .89-2 2v2H4c-1.11 0-1.99.89-1.99 2L2 19c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2zm-6 0h-4V4h4v2z" />
                </svg>
                <span>{activeProject ? `${activeProject.name}` : 'All Projects'}</span>
                <svg className={`w-3.5 h-3.5 transition-transform ${isWorkspaceDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {isWorkspaceDropdownOpen && (
                <div className={`absolute top-full left-0 mt-1.5 w-48 rounded-xl border shadow-2xl overflow-hidden z-40 transition-all duration-200 ${
                  theme === 'dark' ? 'bg-[#121824] border-slate-800' : 'bg-white border-slate-200'
                }`}>
                  <button
                    onClick={() => {
                      setIsWorkspaceDropdownOpen(false);
                      setActiveProject(null);
                      addToast('Showing activities for all projects.');
                    }}
                    className={`w-full text-left px-4 py-2.5 text-xs font-semibold transition-colors ${
                      activeProject === null
                        ? 'bg-[#6366F1] text-white'
                        : theme === 'dark' ? 'text-slate-300 hover:bg-slate-800/60' : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    All Projects
                  </button>
                  {projects.map(proj => (
                    <button
                      key={proj._id}
                      onClick={() => {
                        setIsWorkspaceDropdownOpen(false);
                        setActiveProject(proj);
                        addToast(`Filtering activities by ${proj.name}.`);
                      }}
                      className={`w-full text-left px-4 py-2.5 text-xs font-semibold transition-colors ${
                        activeProject?._id === proj._id
                          ? 'bg-[#6366F1] text-white'
                          : theme === 'dark' ? 'text-slate-300 hover:bg-slate-800/60' : 'text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      {proj.name}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Search Input Bar next to Project Switcher */}
            <div className="relative w-full sm:w-64">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-3.5 w-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <circle cx="11" cy="11" r="8" strokeWidth="2.5"></circle>
                  <line x1="21" y1="21" x2="16.65" y2="16.65" strokeWidth="2.5"></line>
                </svg>
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search feed activities..."
                className={`w-full text-xs rounded-xl pl-9 pr-4 py-2.5 outline-none border transition-all ${
                  theme === 'dark' 
                    ? 'bg-slate-900 border-slate-800 text-slate-200 placeholder-slate-500 focus:border-indigo-500' 
                    : 'bg-white border-slate-200/80 text-slate-800 placeholder-slate-400 focus:bg-white focus:border-indigo-500 shadow-sm'
                }`}
              />
            </div>
          </div>

          {/* SEARCH HIGHLIGHT NOTICE */}
          {searchQuery && (
            <div className={`p-3.5 rounded-xl text-xs flex justify-between items-center ${
              theme === 'dark' ? 'bg-slate-900/60 text-slate-300 border border-slate-800' : 'bg-slate-100 text-slate-600 border border-slate-200'
            }`}>
              <span>Filtering feed items matching: <strong>"{searchQuery}"</strong></span>
              <button onClick={() => setSearchQuery('')} className="text-[#6366F1] font-bold hover:underline">Clear search</button>
            </div>
          )}

          {/* THE FEED COMPONENT */}
          <div className="space-y-8 select-none">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-12 gap-3">
                <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-xs text-slate-400">Loading activity feed...</span>
              </div>
            ) : (
              <>
                {/* TODAY SEGMENT */}
                <div>
                  <h2 className="text-[10px] tracking-wider font-extrabold uppercase mb-4 text-slate-400 dark:text-slate-500">
                    TODAY
                  </h2>
                  
                  {todayPool.length === 0 ? (
                    <div className={`border rounded-2xl p-8 text-center text-xs text-slate-400 ${
                      theme === 'dark' ? 'bg-[#1F1F23]/20 border-slate-800' : 'bg-white border-slate-200'
                    }`}>
                      No activity logs registered today.
                    </div>
                  ) : (
                    <div className={`border rounded-2xl p-6 md:p-8 shadow-sm ${
                      theme === 'dark' ? 'bg-[#1F1F23]/40 border-slate-800' : 'bg-white border-slate-200/95'
                    }`}>
                      <div className="relative">
                        {todayPool.map((event, index) => renderEventItem(event, index, todayPool.length))}
                      </div>
                    </div>
                  )}
                </div>

                {/* YESTERDAY SEGMENT */}
                <div>
                  <h2 className="text-[10px] tracking-wider font-extrabold uppercase mb-4 text-slate-400 dark:text-slate-500">
                    YESTERDAY
                  </h2>

                  {yesterdayPool.length === 0 ? (
                    <div className={`border rounded-2xl p-8 text-center text-xs text-slate-400 ${
                      theme === 'dark' ? 'bg-[#1F1F23]/20 border-slate-800' : 'bg-white border-slate-200'
                    }`}>
                      No activity logs registered yesterday.
                    </div>
                  ) : (
                    <div className={`border rounded-2xl p-6 md:p-8 shadow-sm ${
                      theme === 'dark' ? 'bg-[#1F1F23]/40 border-slate-800' : 'bg-white border-slate-200/95'
                    }`}>
                      <div className="relative">
                        {yesterdayPool.map((event, index) => renderEventItem(event, index, yesterdayPool.length))}
                      </div>
                    </div>
                  )}
                </div>

                {/* OLDER SEGMENT */}
                {olderPool.length > 0 && (
                  <div>
                    <h2 className="text-[10px] tracking-wider font-extrabold uppercase mb-4 text-slate-400 dark:text-slate-500">
                      OLDER
                    </h2>

                    <div className={`border rounded-2xl p-6 md:p-8 shadow-sm ${
                      theme === 'dark' ? 'bg-[#1F1F23]/40 border-slate-800' : 'bg-white border-slate-200/95'
                    }`}>
                      <div className="relative">
                        {olderPool.map((event, index) => renderEventItem(event, index, olderPool.length))}
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

        </div>
      </div>

    </div>
  );
}