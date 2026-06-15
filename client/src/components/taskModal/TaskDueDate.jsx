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

  return (
    <div className="space-y-2">
      <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider font-mono">
        Due Date
      </span>

      <div className="relative">
        <div className="flex items-center bg-[#111215] border border-[#1C1F26] rounded-xl p-2.5">
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
      </div>
    </div>
  );
}