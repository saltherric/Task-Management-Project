import { useState, useContext } from "react";
import { ThemeContext } from "../../contexts/ThemeContext";

export default function ({
  task,
  updateField,
}) {
  const { theme } = useContext(ThemeContext);
  const isDark = theme === "dark";

  const [newTag, setNewTag] = useState("");
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [newTagInput, setNewTagInput] = useState("");

  const getTagStyles = (tag) => {
    if (isDark) {
      switch (tag) {
        case "design": return "bg-purple-950/40 text-purple-400 border border-purple-800/20";
        case "research": return "bg-sky-950/40 text-sky-400 border border-sky-800/20";
        case "frontend": return "bg-amber-950/40 text-amber-400 border border-amber-800/20";
        case "backend": return "bg-emerald-950/40 text-emerald-400 border border-emerald-800/20";
        case "AI": return "bg-pink-950/40 text-pink-400 border border-pink-800/20";
        case "devOps": return "bg-indigo-950/40 text-indigo-400 border border-indigo-800/20";
        default: return "bg-slate-950/40 text-slate-400 border border-slate-800";
      }
    } else {
      switch (tag) {
        case "design": return "bg-purple-50 text-purple-600 border border-purple-200/50";
        case "research": return "bg-sky-50 text-sky-600 border border-sky-200/50";
        case "frontend": return "bg-amber-50 text-amber-600 border border-amber-200/50";
        case "backend": return "bg-emerald-50 text-emerald-600 border border-emerald-200/50";
        case "AI": return "bg-pink-50 text-pink-600 border border-pink-200/50";
        case "devOps": return "bg-indigo-50 text-indigo-600 border border-indigo-200/50";
        default: return "bg-slate-100 text-slate-600 border border-slate-200";
      }
    }
  };

  const availableTags = [
    "backend",
    "frontend",
    "security",
    "auth",
  ];

  const handleRemoveTag = (tag) => {
    updateField(
      "tags",
      task.tags.filter((t) => t !== tag)
    );
  };

  const handleAddExistingTag = (tag) => {
    if (task.tags?.includes(tag)) {
      return;
    }

    updateField("tags", [
      ...(task.tags || []),
      tag,
    ]);

    setActiveDropdown(null);
  };

  const handleAddTag = (e) => {
    if (e.key !== "Enter") return;

    const tag = newTagInput.trim();

    if (!tag) return;

    if (!task.tags?.includes(tag)) {
      updateField("tags", [
        ...(task.tags || []),
        tag,
      ]);
    }

    setNewTagInput("");
    setActiveDropdown(null);
  };

  const createTag = () => {
    if (!newTag.trim()) {
      return;
    }

    addTag(newTag.trim());

    setNewTag("");
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-bold text-slate-500 dark:text-neutral-500 uppercase tracking-wider font-mono">Tags</span>
        
        <div className="relative">
          <button 
            onClick={() => setActiveDropdown(activeDropdown === 'tags' ? null : 'tags')}
            className="text-[10px] text-indigo-650 hover:text-indigo-850 dark:text-indigo-400 dark:hover:text-indigo-300 font-bold transition-colors"
          >
            + Add Tag
          </button>

          {activeDropdown === 'tags' && (
            <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-[#14161C] border border-slate-200 dark:border-[#272B35] shadow-2xl rounded-2xl p-2.5 z-30 space-y-2">
              <span className="text-[10px] text-slate-500 dark:text-neutral-500 block">Create / Add Tag</span>
              <input
                type="text"
                placeholder="Type tag & press enter"
                value={newTagInput}
                onChange={(e) => setNewTagInput(e.target.value)}
                onKeyDown={handleAddTag}
                className="w-full bg-slate-50 dark:bg-[#1C1F28] border border-slate-200 dark:border-neutral-700 rounded-lg p-1.5 text-xs text-slate-800 dark:text-neutral-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
              <div className="space-y-1">
                <p className="text-[9px] text-slate-500 dark:text-neutral-500 uppercase font-mono">Existing Tags</p>
                {availableTags.map((item) => (
                  <button
                    key={item}
                    onClick={() => {
                      if (!task.tags.includes(item)) {
                        handleAddExistingTag(item);
                      }
                    }}
                    className="w-full text-left text-xs py-1 px-1.5 hover:bg-slate-100 dark:hover:bg-neutral-800 rounded text-slate-700 dark:text-neutral-300 transition-colors"
                  >
                    # {item}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {(task.tags || []).map((tag) => (
          <span 
            key={tag} 
            className={`inline-flex items-center gap-1 text-[11px] font-semibold tracking-wide px-2.5 py-0.5 rounded-full ${getTagStyles(tag)}`}
          >
            <span>#{tag}</span>
            <button 
              onClick={() => handleRemoveTag(tag)}
              className="hover:text-rose-450 text-slate-450 dark:text-neutral-500 font-bold ml-0.5"
            >
              ×
            </button>
          </span>
        ))}
      </div>
    </div>
  );
}