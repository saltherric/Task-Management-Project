import { useState } from "react";

export default function ({
  task,
  updateField,
}) {
  const [newTag, setNewTag] = useState("");
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [newTagInput, setNewTagInput] = useState("");

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
        <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider font-mono">Tags</span>
        
        <div className="relative">
          <button 
            onClick={() => setActiveDropdown(activeDropdown === 'tags' ? null : 'tags')}
            className="text-[10px] text-indigo-400 hover:text-indigo-300 font-bold transition-colors"
          >
            + Add Tag
          </button>

          {activeDropdown === 'tags' && (
            <div className="absolute right-0 mt-2 w-48 bg-[#14161C] border border-[#272B35] shadow-2xl rounded-2xl p-2.5 z-30 space-y-2">
              <span className="text-[10px] text-neutral-500 block">Create / Add Tag</span>
              <input
                type="text"
                placeholder="Type tag & press enter"
                value={newTagInput}
                onChange={(e) => setNewTagInput(e.target.value)}
                onKeyDown={handleAddTag}
                className="w-full bg-[#1C1F28] border border-neutral-700 rounded-lg p-1.5 text-xs text-neutral-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
              <div className="space-y-1">
                <p className="text-[9px] text-neutral-500 uppercase font-mono">Existing Tags</p>
                {availableTags.map((item) => (
                  <button
                    key={item}
                    onClick={() => {
                      if (!task.tags.includes(item)) {
                        handleAddExistingTag(item);
                      }
                    }}
                    className="w-full text-left text-xs py-1 px-1.5 hover:bg-neutral-800 rounded text-neutral-300 transition-colors"
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
            className="inline-flex items-center gap-1 text-[11px] font-semibold tracking-wide bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 px-2.5 py-0.5 rounded-full"
          >
            <span>#{tag}</span>
            <button 
              onClick={() => handleRemoveTag(tag)}
              className="hover:text-rose-400 text-neutral-500 font-bold ml-0.5"
            >
              ×
            </button>
          </span>
        ))}
      </div>
    </div>
  );
}