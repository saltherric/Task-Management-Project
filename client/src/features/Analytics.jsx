import React, { useState, useMemo, useContext, useEffect, useRef } from 'react';
import { ThemeContext } from '../contexts/ThemeContext';
import { useParams } from 'react-router-dom';
import { getProjects } from '../services/projectApi';
import { getTasksByProject, getArchivedTasksByProject } from '../services/taskApi';
import { getWorkspaceMembers } from '../services/workspaceApi';


export default function Analytics() {
  const { theme } = useContext(ThemeContext);
  const isDarkMode = theme === 'dark';
  const { workspaceId } = useParams();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [timeRange, setTimeRange] = useState('Last 30 days'); // Controls simulation filters
  const [hoveredBar, setHoveredBar] = useState(null); // High-precision hover visualization states
  const [selectedMemberName, setSelectedMemberName] = useState(null); // Expandable tasks viewer state name
  const [hoveredDonutSegment, setHoveredDonutSegment] = useState(null); // Focus distribution detail state
  const detailsRef = useRef(null);

  useEffect(() => {
    if (selectedMemberName && detailsRef.current) {
      detailsRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [selectedMemberName]);

  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [members, setMembers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

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

        const membersPromise = getWorkspaceMembers(workspaceId)
          .then(res => res.members || [])
          .catch(err => {
            console.error("Failed to fetch workspace members in Analytics:", err);
            return [];
          });

        const [allTasksListArray, workspaceMembers] = await Promise.all([
          Promise.all(tasksPromises),
          membersPromise
        ]);
        const allTasks = allTasksListArray.flat();

        if (isMounted) {
          setTasks(allTasks);
          setProjects(projectsList);
          setMembers(workspaceMembers);
          setIsLoading(false);
        }
      } catch (error) {
        console.error("Error fetching workspace data in Analytics:", error);
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

  // Get data matching the selected time range calculated from real tasks and members
  const currentData = useMemo(() => {
    const today = new Date();
    const days = timeRange === 'Last 7 days' ? 7 : timeRange === 'Last 90 days' ? 90 : 30;
    const currentStart = new Date(today.getTime() - days * 24 * 60 * 60 * 1000);

    // 1. CALCULATE MEMBER COMPLETIONS (including archived tasks)
    const completedTasks = tasks.filter(t => t.status === 'done' && t.completedAt);
    const currentCompleted = completedTasks.filter(t => new Date(t.completedAt) >= currentStart);

    const membersList = members.map(member => {
      const memberTasks = currentCompleted.filter(t => {
        const completerId = t.completedBy ? String(t.completedBy._id || t.completedBy) : null;
        if (completerId) {
          return completerId === String(member._id);
        }
        if (t.assignedTo && Array.isArray(t.assignedTo)) {
          return t.assignedTo.some(u => String(u._id || u) === String(member._id));
        }
        return false;
      });

      return {
        _id: member._id,
        name: member.username || member.name || 'Unknown',
        completed: memberTasks.length,
        tasks: memberTasks.map(t => t.title)
      };
    });

    const sortedMembers = [...membersList].sort((a, b) => b.completed - a.completed);
    // Slice to top 8 to prevent layout overflow while showing key contributors
    const displayMembers = sortedMembers.slice(0, 8);

    // 2. CALCULATE STATUS DISTRIBUTION
    const rangeTasks = tasks.filter(t => {
      const createdDate = t.createdAt ? new Date(t.createdAt) : null;
      const completedDate = t.completedAt ? new Date(t.completedAt) : null;
      return (createdDate && createdDate >= currentStart) || (completedDate && completedDate >= currentStart);
    });

    let doneCount = 0;
    let inProgressCount = 0;
    let todoCount = 0;
    let overdueCount = 0;

    rangeTasks.forEach(t => {
      if (t.status === 'done') {
        doneCount++;
      } else {
        const isOverdue = t.dueDate && new Date(t.dueDate) < today;
        if (isOverdue) {
          overdueCount++;
        } else if (t.status === 'inprogress' || t.status === 'review') {
          inProgressCount++;
        } else {
          todoCount++;
        }
      }
    });

    const totalCount = doneCount + inProgressCount + todoCount + overdueCount;
    const getPercentage = (count) => totalCount > 0 ? Math.round((count / totalCount) * 100) : 0;

    const distribution = [
      { label: 'Done', count: doneCount, percentage: getPercentage(doneCount), color: '#6366F1', tailwindColor: 'bg-blue-500' },
      { label: 'In progress', count: inProgressCount, percentage: getPercentage(inProgressCount), color: '#94A3B8', tailwindColor: 'bg-slate-400' },
      { label: 'To do', count: todoCount, percentage: getPercentage(todoCount), color: '#CBD5E1', tailwindColor: 'bg-slate-300' },
      { label: 'Overdue', count: overdueCount, percentage: getPercentage(overdueCount), color: '#F59E0B', tailwindColor: 'bg-amber-500' }
    ];

    return {
      members: displayMembers,
      distribution
    };
  }, [tasks, members, timeRange]);

  const selectedMember = useMemo(() => {
    if (!selectedMemberName) return null;
    return currentData.members.find(m => m.name === selectedMemberName) || null;
  }, [selectedMemberName, currentData]);

  const maxCompleted = useMemo(() => {
    return Math.max(...(currentData?.members || []).map(m => m.completed), 0);
  }, [currentData]);

  const tickMax = useMemo(() => {
    return maxCompleted > 0 ? Math.ceil(maxCompleted / 4) * 4 : 4;
  }, [maxCompleted]);

  const ticks = useMemo(() => {
    return [tickMax, Math.round(tickMax * 0.75), Math.round(tickMax * 0.5), Math.round(tickMax * 0.25), 0];
  }, [tickMax]);

  const calculatedMetrics = useMemo(() => {
    const today = new Date();
    const days = timeRange === 'Last 7 days' ? 7 : timeRange === 'Last 90 days' ? 90 : 30;
    const currentStart = new Date(today.getTime() - days * 24 * 60 * 60 * 1000);
    const prevStart = new Date(today.getTime() - 2 * days * 24 * 60 * 60 * 1000);

    // Completed Tasks
    const completedTasks = tasks.filter(t => t.status === 'done' && t.completedAt);
    const currentCompleted = completedTasks.filter(t => new Date(t.completedAt) >= currentStart);
    const prevCompleted = completedTasks.filter(t => new Date(t.completedAt) >= prevStart && new Date(t.completedAt) < currentStart);

    // 1. THROUGHPUT
    const currentThroughput = currentCompleted.length;
    const prevThroughput = prevCompleted.length;
    const throughputValue = String(currentThroughput);
    const throughputSubtext = `${(currentThroughput / (days / 7)).toFixed(1)} tasks / week`;
    const throughputTrend = currentThroughput > prevThroughput ? 'positive' : currentThroughput < prevThroughput ? 'negative' : 'neutral';

    // 2. CYCLE TIME
    const getCycleTimeInDays = (t) => {
      const start = t.startedAt ? new Date(t.startedAt) : new Date(t.createdAt);
      const end = new Date(t.completedAt);
      return (end - start) / (1000 * 60 * 60 * 24);
    };

    const formatCycleTime = (val) => {
      if (val < 1.0) {
        return `${(val * 24).toFixed(1)}h`;
      }
      return `${val.toFixed(1)}d`;
    };

    const currentCycleTimes = currentCompleted.map(getCycleTimeInDays);
    const currentAvgCycleTime = currentCycleTimes.length > 0 ? currentCycleTimes.reduce((a, b) => a + b, 0) / currentCycleTimes.length : 0;
    const prevCycleTimes = prevCompleted.map(getCycleTimeInDays);
    const prevAvgCycleTime = prevCycleTimes.length > 0 ? prevCycleTimes.reduce((a, b) => a + b, 0) / prevCycleTimes.length : 0;

    const cycleTimeValue = currentCycleTimes.length > 0 ? formatCycleTime(currentAvgCycleTime) : '0d';
    let cycleTimeSubtext = 'no prior data';
    let cycleTimeTrend = 'neutral';
    if (prevCycleTimes.length > 0) {
      if (currentAvgCycleTime < prevAvgCycleTime) {
        cycleTimeSubtext = `down from ${formatCycleTime(prevAvgCycleTime)}`;
        cycleTimeTrend = 'positive';
      } else if (currentAvgCycleTime > prevAvgCycleTime) {
        cycleTimeSubtext = `up from ${formatCycleTime(prevAvgCycleTime)}`;
        cycleTimeTrend = 'negative';
      } else {
        cycleTimeSubtext = 'no change';
      }
    }

    // 3. ON-TIME DELIVERY
    const currentCompletedWithDue = currentCompleted.filter(t => t.dueDate);
    const currentOnTime = currentCompletedWithDue.filter(t => {
      const due = new Date(t.dueDate);
      due.setHours(23, 59, 59, 999);
      return new Date(t.completedAt) <= due;
    });
    const currentOnTimePercent = currentCompletedWithDue.length > 0 ? (currentOnTime.length / currentCompletedWithDue.length) * 100 : 100;

    const prevCompletedWithDue = prevCompleted.filter(t => t.dueDate);
    const prevOnTime = prevCompletedWithDue.filter(t => {
      const due = new Date(t.dueDate);
      due.setHours(23, 59, 59, 999);
      return new Date(t.completedAt) <= due;
    });
    const prevOnTimePercent = prevCompletedWithDue.length > 0 ? (prevOnTime.length / prevCompletedWithDue.length) * 100 : 100;

    const onTimeValue = `${Math.round(currentOnTimePercent)}%`;
    const onTimeDiff = Math.round(currentOnTimePercent) - Math.round(prevOnTimePercent);
    const onTimeSubtext = onTimeDiff > 0 ? `+${onTimeDiff}% vs last period` : onTimeDiff < 0 ? `${onTimeDiff}% vs last period` : 'no change vs last period';
    const onTimeTrend = currentOnTimePercent > prevOnTimePercent ? 'positive' : currentOnTimePercent < prevOnTimePercent ? 'negative' : 'neutral';

    // 4. ACTIVE MEMBERS
    const workspaceMemberIds = new Set(members.map(m => String(m._id)));

    const currentActiveUsers = new Set();
    tasks.forEach(t => {
      // Created in current period
      if (t.createdAt && new Date(t.createdAt) >= currentStart && t.createdBy) {
        const creatorId = String(t.createdBy._id || t.createdBy);
        if (creatorId && workspaceMemberIds.has(creatorId)) {
          currentActiveUsers.add(creatorId);
        }
      }
      // Completed in current period
      if (t.completedAt && new Date(t.completedAt) >= currentStart && t.completedBy) {
        const completerId = String(t.completedBy._id || t.completedBy);
        if (completerId && workspaceMemberIds.has(completerId)) {
          currentActiveUsers.add(completerId);
        }
      }
    });

    const prevActiveUsers = new Set();
    tasks.forEach(t => {
      // Created in prev period
      if (t.createdAt && new Date(t.createdAt) >= prevStart && new Date(t.createdAt) < currentStart && t.createdBy) {
        const creatorId = String(t.createdBy._id || t.createdBy);
        if (creatorId && workspaceMemberIds.has(creatorId)) {
          prevActiveUsers.add(creatorId);
        }
      }
      // Completed in prev period
      if (t.completedAt && new Date(t.completedAt) >= prevStart && new Date(t.completedAt) < currentStart && t.completedBy) {
        const completerId = String(t.completedBy._id || t.completedBy);
        if (completerId && workspaceMemberIds.has(completerId)) {
          prevActiveUsers.add(completerId);
        }
      }
    });

    const currentActiveCount = currentActiveUsers.size;
    const prevActiveCount = prevActiveUsers.size;
    const totalMembers = members.length;
    const activeValue = String(currentActiveCount);
    const activeSubtext = `${currentActiveCount} of ${totalMembers} members active`;
    const activeTrend = currentActiveCount > prevActiveCount ? 'positive' : currentActiveCount < prevActiveCount ? 'negative' : 'neutral';

    return [
      { id: 'throughput', label: 'Throughput', value: throughputValue, subtext: throughputSubtext, trend: throughputTrend },
      { id: 'cycleTime', label: 'Avg cycle time', value: cycleTimeValue, subtext: cycleTimeSubtext, trend: cycleTimeTrend },
      { id: 'onTime', label: 'On-time delivery', value: onTimeValue, subtext: onTimeSubtext, trend: onTimeTrend },
      { id: 'activeMembers', label: 'Active members', value: activeValue, subtext: activeSubtext, trend: activeTrend }
    ];
  }, [tasks, timeRange, members]);

  // SVG parameters for standard donut calculations (viewBox: 120x120)
  const donutRadius = 38;
  const donutCircumference = 2 * Math.PI * donutRadius; // 238.76

  // Computes precise cumulative strokes for the donut SVG ring using cumulativeOffset math
  const donutSegments = useMemo(() => {
    let cumulativeOffset = 0;
    return currentData.distribution.map((item) => {
      const strokeLength = (item.percentage / 100) * donutCircumference;
      const segment = {
        label: item.label,
        color: item.color,
        strokeLength,
        // negative offset "rotates" this segment's start point
        // to right after the previous segment ends
        strokeOffset: -cumulativeOffset,
        percentage: item.percentage
      };
      cumulativeOffset += strokeLength;
      return segment;
    });
  }, [currentData, donutCircumference]);

  if (isLoading) {
    return (
      <div className={`w-full h-full flex flex-col p-6 md:p-8 transition-colors duration-300 animate-pulse ${isDarkMode ? 'bg-[#090D16] text-white' : 'bg-slate-50 text-slate-800'
        }`}>
        <div className="h-10 w-48 bg-slate-300 dark:bg-slate-850 rounded-xl mb-8"></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-28 bg-slate-300 dark:bg-slate-850 rounded-2xl"></div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1">
          <div className="lg:col-span-2 h-72 bg-slate-300 dark:bg-slate-850 rounded-2xl"></div>
          <div className="h-72 bg-slate-300 dark:bg-slate-850 rounded-2xl"></div>
        </div>
      </div>
    );
  }

  return (
    <div className={`w-full h-full flex flex-col min-h-0 overflow-auto font-sans antialiased transition-colors duration-300 ${theme === 'dark' ? 'bg-[#090D16] text-slate-100' : 'bg-slate-50 text-slate-900'
      }`}>

      {/* MAIN LAYOUT CANVAS */}
      <div className="max-w-7xl px-6 py-5 space-y-8">

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 shrink-0">
          <div>
            <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">Productivity Analytics</h1>
            <p className={`text-xs md:text-sm mt-1.5 font-normal ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
              Measure how your team ships — track velocity, focus and bottlenecks.
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
                {['Last 7 days', 'Last 30 days', 'Last 90 days'].map((range) => (
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

        {/* KPI CARDS GRID */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {calculatedMetrics.map((card) => (
            <div
              key={card.id}
              className={`border rounded-2xl p-5 flex flex-col justify-between shadow-sm hover:shadow-md transition-all ${theme === 'dark'
                  ? 'bg-[#121824] border-slate-800'
                  : 'bg-white border-slate-200/90'
                }`}
            >
              <div>
                <p className={`text-sm font-normal tracking-wider ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'
                  }`}>
                  {card.label}
                </p>
                <h3 className="text-2xl md:text-3xl font-semibold tracking mt-2.5">
                  {card.value}
                </h3>
              </div>

              <div className="mt-1 flex items-center justify-between">
                <span className={`text-xs font-normal ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'
                  }`}>
                  {card.subtext}
                </span>

                {/* Subtle dynamic graphic trend signals */}
                {card.trend === 'positive' && (
                  <span className="flex items-center text-[10px] font-normal text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                    ↑ Improvement
                  </span>
                )}
                {card.trend === 'negative' && (
                  <span className="flex items-center text-[10px] font-normal text-rose-500 bg-rose-500/10 px-2 py-0.5 rounded-full">
                    ↓ At Risk
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* MAIN VISUALIZATIONS SECTION: GRAPH GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* LEFT CONTAINER CARD: TASKS COMPLETED BY MEMBER BAR CHART */}
          <div className={`lg:col-span-2 border rounded-3xl p-6 flex flex-col justify-between transition-all duration-300 ${theme === 'dark' ? 'bg-[#121824] border-slate-800' : 'bg-white border-slate-200/90 shadow-sm'
            }`}>
            <div className="shrink-0 mb-8">
              <h3 className="text-base font-medium tracking-tight">Tasks completed by member</h3>
              <p className={`text-xs font-normal mt-1 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                {timeRange}
              </p>
            </div>

            {/* Custom SVG Column Bar Graph Area */}
            <div className="flex-1 w-full relative min-h-[250px] flex flex-col justify-between select-none">

              {/* Bars row now owns the grid overlay, so scale matches exactly */}
              <div className="flex-1 w-full relative pl-8 pr-4 py-1.5 z-10 flex items-stretch justify-between gap-4 md:gap-8">

                {/* Grid backdrop ticks: now scoped to the bars row only */}
                <div className="absolute inset-0 flex flex-col justify-between py-1.5 pointer-events-none opacity-30">
                  {ticks.map((tick) => (
                    <div key={tick} className="flex items-center w-full gap-3">
                      <span className="text-[10px] font-bold text-slate-450 w-5 text-right shrink-0">{tick}</span>
                      <div className="flex-1 border-t border-dashed border-slate-300 dark:border-slate-800" />
                    </div>
                  ))}
                </div>

                {currentData.members.map((member, index) => {
                  const scalePercent = tickMax > 0 ? (member.completed / tickMax) * 100 : 0;
                  const isHovered = hoveredBar === index;

                  return (
                    <div
                      key={member.name}
                      className="flex-1 flex flex-col justify-end items-center group relative cursor-pointer"
                      onMouseEnter={() => setHoveredBar(index)}
                      onMouseLeave={() => setHoveredBar(null)}
                      onClick={() => setSelectedMemberName(selectedMemberName === member.name ? null : member.name)}
                    >
                      {isHovered && (
                        <div className={`absolute bottom-[105%] left-1/2 -translate-x-1/2 rounded-xl p-3 shadow-xl z-20 border w-44 text-center pointer-events-none animate-bounce ${theme === 'dark' ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'}`}>
                          <p className="text-xs font-medium">{member.name}</p>
                          <p className="text-[11px] font-bold text-[#6366F1] mt-0.5">{member.completed} tasks completed</p>
                          <p className="text-[10px] text-slate-500 mt-1">Click bar to view full log</p>
                        </div>
                      )}

                      <div className="w-full max-w-[56px] h-full relative rounded-t-xl overflow-hidden transition-all duration-300 z-10">
                        <div className={`absolute inset-0 opacity-10 ${theme === 'dark' ? 'bg-slate-800' : 'bg-slate-200'}`} />
                        <div
                          className="absolute bottom-0 left-0 right-0 rounded-t-xl bg-[#6366F1] hover:bg-blue-600 transition-all duration-500 ease-out"
                          style={{ height: `${scalePercent}%`, minHeight: scalePercent > 0 ? '8px' : '0px' }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* X-axis labels stay outside, unaffected by the grid now */}
              <div className="flex justify-between items-center pl-8 pr-4 mt-3.5 shrink-0 gap-4 md:gap-8">
                {currentData.members.map((member) => (
                  <button
                    key={member.name}
                    onClick={() => setSelectedMemberName(selectedMemberName === member.name ? null : member.name)}
                    className={`text-xs font-bold flex-1 text-center transition-colors focus:outline-none truncate ${selectedMemberName === member.name ? 'text-[#6366F1] underline underline-offset-4' : theme === 'dark' ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-900'}`}
                  >
                    {member.name}
                  </button>
                ))}
              </div>

            </div>
          </div>

          {/* RIGHT CONTAINER CARD: STATUS DISTRIBUTION DONUT CHART */}
          <div className={`border rounded-3xl p-6 flex flex-col justify-between transition-all duration-300 ${theme === 'dark' ? 'bg-[#121824] border-slate-800' : 'bg-white border-slate-200/90 shadow-sm'
            }`}>
            <div className="shrink-0 mb-6">
              <h3 className="text-base font-semibold tracking-tight">Status distribution</h3>
              <p className={`text-xs font-medium mt-1 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                Across all projects
              </p>
            </div>

            {/* Centered SVG Circular Donut Visualizer */}
            <div className="flex-1 flex flex-col justify-center items-center py-6 min-h-[220px]">
              <div className="relative w-44 h-44 select-none">
                <svg
                  className="w-full h-full transform -rotate-90"
                  viewBox="0 0 100 100"
                >
                  {/* Backdrop hollow track ring */}
                  <circle
                    cx="50"
                    cy="50"
                    r={donutRadius}
                    fill="none"
                    stroke={theme === 'dark' ? '#1E293B' : '#F1F5F9'}
                    strokeWidth="11"
                  />

                  {/* Multi-segmented color arc rendering with custom gap intervals */}
                  {donutSegments.map((seg, idx) => {
                    const isHovered = hoveredDonutSegment === idx;
                    const strokeWidthValue = isHovered ? 14 : 11;
                    const visualGap = 0; 
                    const adjustedLength = seg.strokeLength > 0 
                      ? Math.max(seg.strokeLength - visualGap, 0) 
                      : 0;

                    if (seg.percentage === 0 || adjustedLength <= 0) return null;

                    return (
                      <circle
                        key={seg.label}
                        cx="50"
                        cy="50"
                        r={donutRadius}
                        fill="none"
                        stroke={seg.color}
                        strokeWidth={strokeWidthValue}
                        strokeDasharray={`${adjustedLength} ${donutCircumference - adjustedLength}`}
                        strokeDashoffset={seg.strokeOffset}
                        strokeLinecap="butt"
                        className="transition-all duration-300 cursor-pointer"
                        onMouseEnter={() => setHoveredDonutSegment(idx)}
                        onMouseLeave={() => setHoveredDonutSegment(null)}
                      />
                    );
                  })}
                </svg>

                {/* Inner center text labels showing total percentage or highlighted values */}
                <div className="absolute inset-0 flex flex-col justify-center items-center pointer-events-none text-center">
                  {hoveredDonutSegment !== null ? (
                    <>
                      <span className="text-xl font-black text-[#6366F1]">
                        {currentData.distribution[hoveredDonutSegment].percentage}%
                      </span>
                      <span className="text-[9px] uppercase tracking-wider text-slate-400 mt-0.5">
                        {currentData.distribution[hoveredDonutSegment].label}
                      </span>
                    </>
                  ) : (
                    <>
                      <span className="text-2xl font-black">
                        {currentData.distribution.reduce((acc, curr) => acc + curr.count, 0)}
                      </span>
                      <span className="text-[10px] uppercase tracking-widest text-slate-450 mt-1 font-bold">
                        Tasks Total
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Donut Legend items row matching colors of image_ff6964.png */}
            <div className="grid grid-cols-2 gap-y-2 mt-4 shrink-0 px-2">
              {currentData.distribution.map((item, idx) => {
                const isHovered = hoveredDonutSegment === idx;
                return (
                  <div
                    key={item.label}
                    className={`flex items-center gap-2 cursor-pointer transition-all ${isHovered ? 'scale-105' : 'opacity-85'
                      }`}
                    onMouseEnter={() => setHoveredDonutSegment(idx)}
                    onMouseLeave={() => setHoveredDonutSegment(null)}
                  >
                    <span className={`w-3 h-3 rounded-full shrink-0`} style={{ backgroundColor: item.color }} />
                    <span className="text-xs font-bold truncate">
                      {item.label} <span className="text-[10px] text-slate-450 font-bold">({item.percentage}%)</span>
                    </span>
                  </div>
                );
              })}
            </div>

          </div>

        </div>

        {/* INTERACTIVE DRILLDOWN: SELECTED MEMBER DETAILS TABLE */}
        {selectedMember && (
          <div ref={detailsRef} className={`border rounded-3xl p-6 transition-all duration-300 animate-fade-in ${theme === 'dark' ? 'bg-[#121824] border-slate-800' : 'bg-white border-slate-200/90 shadow-sm'
            }`}>
            <div className="flex items-center justify-between border-b pb-4 mb-4 dark:border-slate-800/80">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-950/40 text-[#6366F1] flex items-center justify-center font-black text-xs">
                  {selectedMember.name.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <h4 className="text-base font-medium tracking-tight">Completed Tasks — {selectedMember.name}</h4>
                  <p className="text-xs text-slate-500 font-medium">Detailed tracking during {timeRange}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedMemberName(null)}
                className={`p-1.5 rounded-lg border text-xs font-bold ${theme === 'dark'
                    ? 'border-slate-800 hover:bg-slate-800'
                    : 'border-slate-200 hover:bg-slate-100'
                  }`}
              >
                ✕ 
              </button>
            </div>

            <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1 scrollbar-thin">
              {selectedMember.tasks.map((taskName, index) => (
                <div
                  key={index}
                  className={`flex items-center justify-between p-3.5 border rounded-xl transition-all ${theme === 'dark' ? 'bg-slate-900/50 border-slate-800 hover:bg-slate-900' : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                    }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="w-1 h-1 text-2xl rounded-full bg-emerald-500 shrink-0" />
                    <span className="text-sm font-semibold truncate">{taskName}</span>
                  </div>
                  <span className="text-[10px] font-medium tracking-widest text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-md shrink-0">
                    Verified Done
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>

    </div>
  );
}
