import React from "react";

export default function TaskProperties({
  task,
  updateField,
}) {
  return (
    <div className="space-y-6">

      <div>
        <label className="block text-sm text-neutral-400 mb-2">
          Status
        </label>

        <select
          value={task.status}
          onChange={(e) =>
            updateField(
              "status",
              e.target.value
            )
          }
          className="
            w-full
            bg-[#181A20]
            border
            border-[#2A2E39]
            rounded-lg
            px-3 py-2
          "
        >
          <option value="todo">
            Todo
          </option>

          <option value="in_progress">
            In Progress
          </option>

          <option value="review">
            Review
          </option>

          <option value="done">
            Done
          </option>
        </select>
      </div>

      <div>
        <label className="block text-sm text-neutral-400 mb-2">
          Priority
        </label>

        <select
          value={task.priority}
          onChange={(e) =>
            updateField(
              "priority",
              e.target.value
            )
          }
          className="
            w-full
            bg-[#181A20]
            border
            border-[#2A2E39]
            rounded-lg
            px-3 py-2
          "
        >
          <option value="low">
            Low
          </option>

          <option value="medium">
            Medium
          </option>

          <option value="high">
            High
          </option>

          <option value="critical">
            Critical
          </option>
        </select>
      </div>

      <div>
        <label className="block text-sm text-neutral-400 mb-2">
          Due Date
        </label>

        <input
          type="date"
          value={
            task.dueDate
              ? task.dueDate.slice(0, 10)
              : ""
          }
          onChange={(e) =>
            updateField(
              "dueDate",
              e.target.value
            )
          }
          className="
            w-full
            bg-[#181A20]
            border
            border-[#2A2E39]
            rounded-lg
            px-3 py-2
          "
        />
      </div>

    </div>
  );
}