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
        <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider font-mono">
            Due Date
        </span>

        <div className="relative">
            <div className={`flex items-center bg-[#111215] rounded-xl p-2.5 border ${
                isOverdue 
                    ?"text-red-400"
                    : "text-neutral-400"
                }`}
            >
            <input
                type="date"
                value={formattedDate}
                onChange={(e) =>
                    updateField(
                        "dueDate",
                        e.target.value
                    )
                }
                className="bg-transparent text-xs text-neutral-200 focus:outline-none w-full [color-scheme:dark]"
            />
            </div>
            {isOverdue && (
                <p className="text-[10px] text-red-400">
                    Overdue
                </p>
            )}
        </div>
    </div>
  );
}