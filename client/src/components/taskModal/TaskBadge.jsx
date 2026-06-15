import React from "react";

export default function TaskBadge({
  task,
  saveStatus,
  onClose,
  updateField,
  onDelete,
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
        return "text-yellow-400";
      case "saved":
        return "text-emerald-400";
      case "error":
        return "text-red-400";
      default:
        return "text-neutral-400";
    }
  };

  return (
    <div className="px-6 py-3 border-b border-[#1A1C20] bg-[#111215] flex items-center justify-between">

      {/* Left Side */}
      <div className="flex items-center gap-3">
        <span
          className={`flex items-center gap-1.5 text-xs bg-[#191B1F] py-1 px-2.5 rounded-md border border-[#242831] ${getSaveStatusColor()}`}
        >
          {getSaveStatusText()}
        </span>

        <span className="hidden sm:inline text-xs text-neutral-500">
          • Auto-saving enabled
        </span>
      </div>

      {/* Right Side */}
      <div className="flex items-center gap-1">

        {/* Archive */}
        <button 
          onClick={() => updateField(
              "isArchived",
              !task.isArchived
            )
          }
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            task.isArchived
              ? "bg-amber-500/15 border border-amber-500/30 text-amber-300"
              : "text-neutral-400 hover:text-neutral-100 hover:bg-[#1E2026]"
          }`}
        >
          {task.isArchived ? (
            <i className="fa-solid fa-box-archive text-amber-300" />
          ) : (
            <i className="fa-solid fa-box-archive text-neutral-400 group-hover:text-neutral-100" />
          )}
          <span className="hidden md:inline">
            {task.isArchived
              ? "Archived"
              : "Archive"}
          </span>
        </button>

        {/* Delete */}
        <button
          onClick={onDelete}
          className="flex items-center gap-1.5 px-3 py-1.5 text-neutral-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg text-xs font-semibold transition-all"
        >
          <span className="hidden md:inline">
            <i className="fa-solid fa-trash"></i> Delete
          </span>
        </button>

        <div className="h-5 w-px bg-[#222429] mx-2" />

        {/* Close */}
        <button
          onClick={onClose}
          className="p-1.5 text-neutral-400 hover:text-neutral-100 hover:bg-[#1E2026] rounded-lg transition-all"
        >
          X
        </button>

      </div>
    </div>
  );
}