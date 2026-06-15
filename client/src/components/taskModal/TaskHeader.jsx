import React, { useEffect, useState } from "react";

export default function TaskHeader({ task, updateField }) {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [tempTitle, setTempTitle] = useState(task?.title || "");
  const [activeDropdown, setActiveDropdown] = useState(null);
  const statusConfig = {
    todo: {
        label: "To do",
        bg: "bg-slate-500/10",
        border: "border-slate-500/20",
        text: "text-slate-300"
    },
    in_progress: {
        label: "In Progress",
        bg: "bg-blue-500/10",
        border: "border-blue-500/20",
        text: "text-blue-300"
    },
    review: {
        label: "Review",
        bg: "bg-amber-500/10",
        border: "border-amber-500/20",
        text: "text-amber-300"
    },
    done: {
        label: "Done",
        bg: "bg-emerald-500/20",
        border: "border-emerald-500/20",
        text: "text-emerald-300"
    }
  };

  const priorityConfig = {
    low: {
        label: "Low",
        bg: "bg-green-500/10",
        border: "border-green-500/20",
        text: "text-green-300",
    },
    medium: {
        label: "Medium",
        bg: "bg-yellow-500/10",
        border: "border-yellow-500/20",
        text: "text-yellow-300",
    },
    high: {
        label: "High",
        bg: "bg-orange-500/10",
        border: "border-orange-500/20",
        text: "text-orange-300",
    },
  };
  
  useEffect(() => {
    setTempTitle(task?.title || "");
  }, [task?.title]);

  if (!task) return null;

  const saveTitle = () => {
    const value = tempTitle.trim();

    if (
      value &&
      value !== task.title
    ) {
      updateField("title", value);
    }

    setIsEditingTitle(false);
  };

  return (
    <div
      className="
        sticky
        top-0
        z-20
        px-6
        py-5
        bg-[#0D0E11]
        border-b
        border-[#1C1D22]
      "
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">

        {/* Left */}
        <div className="flex-1">

          {/* Meta */}
          <div className="flex flex-wrap items-center gap-2 mb-2">

            <span className="text-xs font-semibold text-neutral-500 tracking-wider font-mono">
              #{task._id?.slice(-6)}
            </span>

            <span className="text-neutral-600">•</span>

            {/* Status */}
            <div className="relative">

              <button
                onClick={() =>
                  setActiveDropdown(
                    activeDropdown === "status"
                      ? null
                      : "status"
                  )
                }
                className={`
                  flex items-center gap-1.5
                  px-2 py-0.5
                  rounded-md
                  text-xs
                  font-semibold
                  border
                  ${statusConfig[task.status]?.bg}
                  ${statusConfig[task.status]?.border}
                  ${statusConfig[task.status]?.text}
                `}
              >
                <span>
                  {
                    statusConfig[
                      task.status
                    ]?.label
                  }
                </span>

              </button>

              {activeDropdown ===
                "status" && (
                <div className="absolute left-0 mt-1 w-40 rounded-xl bg-[#14161C] border border-[#272B35] shadow-2xl p-1 z-30">

                  {Object.keys(
                    statusConfig
                  ).map((key) => (
                    <button
                      key={key}
                      onClick={() => {
                        updateField(
                          "status",
                          key
                        );

                        setActiveDropdown(
                          null
                        );
                      }}
                      className="
                        w-full
                        text-left
                        px-3 py-2
                        rounded-lg
                        text-xs
                        hover:bg-[#1E212A]
                      "
                    >
                      {
                        statusConfig[key]
                          .label
                      }
                    </button>
                  ))}
                </div>
              )}

            </div>

            {/* Priority */}
            <div className="relative">

              <button
                onClick={() =>
                  setActiveDropdown(
                    activeDropdown ===
                      "priority"
                      ? null
                      : "priority"
                  )
                }
                className={`
                  flex items-center gap-1.5
                  px-2 py-0.5
                  rounded-md
                  text-xs
                  font-semibold
                  border
                  ${priorityConfig[task.priority]?.bg}
                  ${priorityConfig[task.priority]?.border}
                  ${priorityConfig[task.priority]?.text}
                `}
              >
                <span>
                  {
                    priorityConfig[
                      task.priority
                    ]?.label
                  }
                </span>

              </button>

              {activeDropdown ===
                "priority" && (
                <div className="absolute left-0 mt-1 w-44 rounded-xl bg-[#14161C] border border-[#272B35] shadow-2xl p-1 z-30">

                  {Object.keys(
                    priorityConfig
                  ).map((key) => (
                    <button
                      key={key}
                      onClick={() => {
                        updateField(
                          "priority",
                          key
                        );

                        setActiveDropdown(
                          null
                        );
                      }}
                      className="
                        w-full
                        text-left
                        px-3 py-2
                        rounded-lg
                        text-xs
                        hover:bg-[#1E212A]
                      "
                    >
                      {
                        priorityConfig[
                          key
                        ].label
                      }
                    </button>
                  ))}
                </div>
              )}

            </div>

          </div>

          {/* Editable Title */}
          {isEditingTitle ? (
            <div className="flex gap-2">

              <input
                value={tempTitle}
                onChange={(e) =>
                  setTempTitle(
                    e.target.value
                  )
                }
                onKeyDown={(e) => {
                  if (
                    e.key ===
                    "Enter"
                  )
                    saveTitle();

                  if (
                    e.key ===
                    "Escape"
                  ) {
                    setTempTitle(
                      task.title
                    );

                    setIsEditingTitle(
                      false
                    );
                  }
                }}
                autoFocus
                className="
                  flex-1
                  bg-[#16181D]
                  border
                  border-indigo-500/40
                  rounded-xl
                  px-3 py-2
                  text-xl
                  font-bold
                  text-white
                "
              />

              <button
                onClick={saveTitle}
                className="
                  px-4 py-2
                  rounded-lg
                  bg-indigo-600
                "
              >
                Save
              </button>

            </div>
          ) : (
            <h2
              onClick={() =>
                setIsEditingTitle(true)
              }
              className="
                text-2xl
                font-bold
                text-white
                cursor-pointer
                hover:bg-[#15171D]
                rounded-lg
                px-2 py-1
                -mx-2
              "
            >
              {task.title}
            </h2>
          )}

        </div>

        {/* Right */}
        <div
          className="
            bg-[#171A21]
            border
            border-[#272B35]
            px-3 py-1.5
            rounded-xl
            shrink-0
          "
        >
          <span className="text-xs text-neutral-400">
            Project:
          </span>

          <span className="ml-2 text-xs text-indigo-400 font-bold uppercase">
            Task Management System
          </span>
        </div>

      </div>
    </div>
  );
}