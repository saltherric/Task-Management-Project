import React, { useState } from "react";

export default function TaskMetaData({ task }) {
  const [metaExpanded, setMetaExpanded] = useState(false);

  const formatDate = (date) => {
    if (!date) return "-";

    return new Date(date).toLocaleString();
  };

  if (!task) return null;

  return (
    <div className="border-t border-slate-200 dark:border-[#1C1D22] pt-4 space-y-2">
      <button
        onClick={() =>
          setMetaExpanded(!metaExpanded)
        }
        className="w-full flex items-center justify-between text-slate-500 dark:text-neutral-400 hover:text-slate-800 dark:hover:text-neutral-100 transition-colors"
      >
        <span className="text-[10px] font-bold uppercase tracking-wider font-mono">
          Metadata Properties
        </span>

        {metaExpanded ? (
          <i className="fa-solid fa-chevron-down text-neutral-500 text-xs"></i>
        ) : (
          <i className="fa-solid fa-chevron-right text-neutral-500 text-xs"></i>
        )}
      </button>

      {metaExpanded && (
        <div className="bg-slate-50 dark:bg-[#121316]/50 rounded-xl p-3 space-y-2.5 text-[11px] border border-slate-200 dark:border-[#1A1C20] divide-y divide-slate-100 dark:divide-[#1D2028]">
          
          <div className="flex justify-between py-1.5">
            <span className="text-neutral-500 font-mono">
              Created By:
            </span>

            <span className="text-slate-700 dark:text-neutral-300 font-semibold">
              {task.createdBy?.username ||
                "Unknown"}
            </span>
          </div>

          <div className="flex justify-between py-1.5">
            <span className="text-neutral-500 font-mono">
              Created At:
            </span>

            <span className="text-slate-700 dark:text-neutral-300 font-semibold">
              {formatDate(task.createdAt)}
            </span>
          </div>

          <div className="flex justify-between py-1.5">
            <span className="text-neutral-500 font-mono">
              Last Updated:
            </span>

            <span className="text-slate-700 dark:text-neutral-300 font-semibold">
              {formatDate(task.updatedAt)}
            </span>
          </div>

          <div className="flex justify-between py-1.5">
            <span className="text-neutral-500 font-mono">
              Completed At:
            </span>

            <span className="text-slate-700 dark:text-neutral-300 font-semibold">
              {formatDate(task.completedAt)}
            </span>
          </div>

          <div className="flex justify-between py-1.5">
            <span className="text-neutral-500 font-mono">
              Archived:
            </span>

            <span
              className={`font-semibold ${
                task.isArchived
                  ? "text-amber-600 dark:text-amber-400"
                  : "text-slate-450 dark:text-neutral-500"
              }`}
            >
              {task.isArchived
                ? "Archived"
                : "Active"}
            </span>
          </div>

          <div className="flex justify-between py-1.5">
            <span className="text-neutral-500 font-mono">
              Archived At:
            </span>

            <span className="text-slate-700 dark:text-neutral-300 font-semibold">
              {formatDate(task.archivedAt)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}