import React from "react";

export default function TaskDueDate({
  task,
  updateField,
}) {
    const formattedDate = task?.dueDate
    ? new Date(task.dueDate)
        .toISOString()
        .split("T")[0]
    : "";

    const isOverdue = task?.dueDate
        ? new Date(task.dueDate).setHours(23, 59, 59, 999) <
            Date.now()
        : false;

  return (
    <div className="space-y-2">
        <span className="text-[10px] font-bold text-slate-500 dark:text-neutral-500 uppercase tracking-wider font-mono">
            Due Date
        </span>

        <div className="relative">
            <div className={`flex items-center bg-slate-50/50 dark:bg-[#111215]/50 hover:bg-slate-100/50 dark:hover:bg-[#1C1E24]/30 rounded-xl p-2 border border-slate-200 dark:border-slate-800/80 focus-within:border-indigo-500/50 focus-within:ring-2 focus-within:ring-indigo-500/10 transition-all duration-200 ${
                isOverdue 
                    ? "border-red-500/30 dark:border-red-500/25 text-red-500 dark:text-red-400"
                    : "text-slate-500 dark:text-neutral-450"
                }`}
            >
              <i className="fa-regular fa-calendar text-slate-450 dark:text-neutral-500 mr-2 ml-1 text-xs shrink-0"></i>
              <input
                  type="date"
                  value={formattedDate}
                  onChange={(e) =>
                      updateField(
                          "dueDate",
                          e.target.value
                      )
                  }
                  className="bg-transparent text-xs text-slate-800 dark:text-neutral-200 focus:outline-none w-full dark:[color-scheme:dark] cursor-pointer"
              />
            </div>
            {isOverdue && (
                <p className="text-[10px] text-red-500 dark:text-red-400 font-semibold mt-1.5 ml-1">
                    ⚠️ Overdue
                </p>
            )}
        </div>
    </div>
  );
}