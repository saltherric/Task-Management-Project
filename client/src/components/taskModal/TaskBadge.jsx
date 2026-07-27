import React from "react";
import {
  archiveTask,
  unArchiveTask,
} from "../../services/taskApi";

export default function TaskBadge({
  task,
  saveStatus,
  onClose,
  onTaskDelete,
  onTaskUpdate,
}) {
  const getSaveStatusText = () => {
    switch (saveStatus) {
      case "saving":
        return "Saving...";
      case "saved":
        return "Saved ✓";
      case "error":
        return "Save Failed";
      default:
        return "";
    }
  };

  const getSaveStatusColor = () => {
    switch (saveStatus) {
      case "saving":
        return "text-yellow-600 dark:text-yellow-400";
      case "saved":
        return "text-emerald-600 dark:text-emerald-400";
      case "error":
        return "text-rose-600 dark:text-red-400";
      default:
        return "text-slate-500 dark:text-neutral-450";
    }
  };

  const handleArchive = async () => {
    try {
      await archiveTask(task._id);

      const updatedTask = {
        ...task,
        isArchived: true,
      };

      onTaskUpdate(updatedTask);

    } catch (error) {
      console.error(
        "Failed to archive task",
        error
      );
    }
  };

  const handleUnarchive = async () => {
    try {
      await unArchiveTask(task._id);

      const updatedTask = {
        ...task,
        isArchived: false,
      };

      onTaskUpdate(updatedTask);
    } catch (error) {
      console.error(
        "Failed to restore task",
        error
      );
    }
  };
  return (
    <div className="px-6 py-3 border-b border-slate-200 dark:border-slate-800/80 bg-slate-50/50 dark:bg-[#0D0F12] flex items-center justify-between">
      
      {/* Left Side */}
      <div className="flex items-center gap-3">
        <span
          className={`flex items-center gap-1.5 text-xs bg-slate-100/80 dark:bg-[#191B1F]/60 py-1 px-2.5 rounded-lg border border-slate-200 dark:border-[#242831]/80 ${getSaveStatusColor()}`}
        >
          {saveStatus === "saved" && (
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
          )}
          {saveStatus === "saving" && (
            <span className="w-1.5 h-1.5 rounded-full bg-yellow-500 animate-pulse shrink-0" />
          )}
          {saveStatus === "error" && (
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
          )}
          <span className="font-semibold">{getSaveStatusText()}</span>
        </span>

        <span className="hidden sm:inline text-xs text-slate-450 dark:text-neutral-500">
          • Auto-saving enabled
        </span>
      </div>

      {/* Right Side */}
      <div className="flex items-center gap-1">

        {/* Archive */}
        <button
          onClick={() => {
            if (task.isArchived) {
              handleUnarchive();
            } else {
              handleArchive();
            }
          }}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            task.isArchived
              ? "bg-amber-500/15 border border-amber-500/30 text-amber-600 dark:text-amber-300"
              : "text-slate-500 dark:text-neutral-400 hover:text-slate-800 dark:hover:text-neutral-100 hover:bg-slate-200/50 dark:hover:bg-[#1E2026]"
          }`}
        >
          <i className="fa-solid fa-box-archive" />

          <span className="hidden md:inline">
            {task.isArchived
              ? "Restore"
              : "Archive"}
          </span>
        </button>

        {/* Delete */}
        <button
          onClick={onTaskDelete}
          className="flex items-center gap-1.5 px-3 py-1.5 text-slate-500 dark:text-neutral-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-500/10 rounded-lg text-xs font-semibold transition-all"
        >
          <span className="hidden md:inline">
            <i className="fa-solid fa-trash"></i> Delete
          </span>
        </button>

        <div className="h-5 w-px bg-slate-200 dark:bg-[#222429] mx-2" />

        {/* Close */}
        <button
          onClick={onClose}
          className="p-1.5 text-slate-500 dark:text-neutral-400 hover:text-slate-800 dark:hover:text-neutral-100 hover:bg-slate-200/50 dark:hover:bg-[#1E2026] rounded-lg transition-all"
          aria-label="Close modal"
        >
          <svg className="w-4 h-4 text-slate-550 dark:text-neutral-400" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

      </div>
    </div>
  );
}