import RichTextEditor from "./RichTextEditor";

export default function TaskDescription({
  task,
  updateField,
}) {
  return (
    <section className="space-y-3">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-semibold text-neutral-400 uppercase tracking-wider">
          <span className="h-1 w-2 bg-indigo-500 rounded-full"></span>
          <span>Description & Specs</span>
        </div>
      </div>

      {/* Editor */}
      <div className="relative group ">

        <RichTextEditor
          content={task.description}
          onChange={(html) =>
            updateField(
              "description",
              html
            )
          }
        />

        {/* <div
          className="
            absolute
            bottom-3
            right-3
            opacity-0
            group-hover:opacity-100
            transition-opacity
            text-[10px]
            text-neutral-500
            pointer-events-none
          "
        >
          Rich text enabled
        </div> */}

      </div>

    </section>
  );
}
