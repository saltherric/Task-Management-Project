import React, { useEffect, useState, useContext } from "react";
import { ThemeContext } from "../../contexts/ThemeContext";

export default function TaskHeader({ task, updateField }) {
  const { theme } = useContext(ThemeContext);
  const isDark = theme === "dark";

  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [tempTitle, setTempTitle] = useState(task?.title || "");
  const [activeDropdown, setActiveDropdown] = useState(null);
  
  const statusConfig = {
    todo: {
        label: "To do",
        dotClass: "bg-slate-400",
        bg: isDark ? "bg-slate-500/10" : "bg-slate-100",
        border: isDark ? "border-slate-500/20" : "border-slate-250",
        text: isDark ? "text-slate-300" : "text-slate-600"
    },
    inprogress: {
        label: "In Progress",
        dotClass: "bg-blue-500",
        bg: isDark ? "bg-blue-500/10" : "bg-blue-50",
        border: isDark ? "border-blue-500/20" : "border-blue-200/50",
        text: isDark ? "text-blue-300" : "text-blue-600"
    },
    review: {
        label: "Review",
        dotClass: "bg-amber-500",
        bg: isDark ? "bg-amber-500/10" : "bg-amber-50",
        border: isDark ? "border-amber-500/20" : "border-amber-200/50",
        text: isDark ? "text-amber-300" : "text-amber-600"
    },
    done: {
        label: "Done",
        dotClass: "bg-emerald-500",
        bg: isDark ? "bg-emerald-500/20" : "bg-emerald-50",
        border: isDark ? "border-emerald-500/20" : "border-emerald-250/50",
        text: isDark ? "text-emerald-300" : "text-emerald-600"
    }
  };

  const priorityConfig = {
    low: {
        label: "Low",
        bg: isDark ? "bg-green-500/10" : "bg-emerald-50",
        border: isDark ? "border-green-500/20" : "border-emerald-200/50",
        text: isDark ? "text-green-300" : "text-emerald-600",
    },
    medium: {
        label: "Medium",
        bg: isDark ? "bg-yellow-500/10" : "bg-amber-50",
        border: isDark ? "border-yellow-500/20" : "border-amber-200/50",
        text: isDark ? "text-yellow-300" : "text-amber-600",
    },
    high: {
        label: "High",
        bg: isDark ? "bg-orange-500/10" : "bg-rose-50",
        border: isDark ? "border-orange-500/20" : "border-rose-200/50",
        text: isDark ? "text-orange-300" : "text-rose-600",
    },
  };

  useEffect(() => {
    setTempTitle(task?.title || "");
  }, [task?.title]);

  if (!task) return null;

  const saveTitle = () => {
    const value = tempTitle.trim();

    if (
      value && value !== task.title
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
        bg-slate-50/50
        dark:bg-[#0D0E11]
        border-b
        border-slate-200
        dark:border-[#1C1D22]
        backdrop-blur-md
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
                  px-2.5 py-0.5
                  rounded-lg
                  text-xs
                  font-semibold
                  border
                  hover:opacity-90 transition-all cursor-pointer
                  ${statusConfig[task.status]?.bg}
                  ${statusConfig[task.status]?.border}
                  ${statusConfig[task.status]?.text}
                `}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${statusConfig[task.status]?.dotClass}`} />
                <span>
                  {
                    statusConfig[
                      task.status
                    ]?.label
                  }
                </span>
                <i className="fa-solid fa-chevron-down text-[8px] opacity-70 ml-0.5" />
              </button>

              {activeDropdown ===
                "status" && (
                <div className="absolute left-0 mt-1 w-40 rounded-xl bg-white dark:bg-[#14161C] border border-slate-200 dark:border-[#272B35] shadow-2xl p-1 z-30">

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
                        text-slate-700
                        dark:text-neutral-300
                        hover:bg-slate-100
                        dark:hover:bg-[#1E212A]
                        flex items-center gap-2
                      "
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${statusConfig[key].dotClass}`} />
                      <span>
                        {
                          statusConfig[key]
                            .label
                        }
                      </span>
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
                  px-2.5 py-0.5
                  rounded-lg
                  text-xs
                  font-semibold
                  border
                  hover:opacity-90 transition-all cursor-pointer
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
                <i className="fa-solid fa-chevron-down text-[8px] opacity-70 ml-0.5" />
              </button>

              {activeDropdown ===
                "priority" && (
                <div className="absolute left-0 mt-1 w-44 rounded-xl bg-white dark:bg-[#14161C] border border-slate-200 dark:border-[#272B35] shadow-2xl p-1 z-30">

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
                        text-slate-700
                        dark:text-neutral-300
                        hover:bg-slate-100
                        dark:hover:bg-[#1E212A]
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
                  bg-white
                  dark:bg-[#16181D]
                  border
                  border-slate-350
                  dark:border-indigo-500/40
                  rounded-xl
                  px-3 py-2
                  text-xl
                  font-bold
                  text-slate-900
                  dark:text-white
                "
              />

              <button
                onClick={saveTitle}
                className="
                  px-4 py-2
                  rounded-lg
                  bg-indigo-600
                  text-white
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
                text-slate-900
                dark:text-white
                cursor-pointer
                hover:bg-slate-100
                dark:hover:bg-[#15171D]
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
            flex items-center gap-1.5
            bg-indigo-500/10
            dark:bg-indigo-500/15
            border
            border-indigo-500/25
            px-3 py-1.5
            rounded-xl
            shrink-0
          "
        >
          <i className="fa-solid fa-folder text-indigo-500 dark:text-indigo-400 text-xs" />
          <span className="text-[10px] uppercase font-bold text-indigo-500 dark:text-indigo-350 tracking-wider">
            {task.project.name}
          </span>
        </div>

      </div>
    </div>
  );
}