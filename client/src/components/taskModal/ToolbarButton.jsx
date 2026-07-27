export default function ToolbarButton({
  onClick,
  active,
  disabled,
  children,
  title,
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      disabled={disabled}
      aria-label={title}
      aria-pressed={active}
      className={`
        flex items-center justify-center
        min-w-[32px] h-8 px-2
        rounded-md
        text-sm font-medium
        transition-all duration-200
        border border-transparent
        disabled:cursor-not-allowed disabled:opacity-40

        ${
          active
            ? "bg-indigo-600 text-white shadow-md"
            : "text-slate-600 dark:text-neutral-300 hover:bg-slate-200 dark:hover:bg-[#252834] hover:text-slate-900 dark:hover:text-white disabled:hover:bg-transparent disabled:hover:text-slate-600 dark:disabled:hover:text-neutral-300"
        }
      `}
    >
      {children}
    </button>
  );
}
