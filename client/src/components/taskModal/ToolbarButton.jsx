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
        min-w-[40px] h-10 px-3
        rounded-lg
        text-sm font-medium
        transition-all duration-200
        border border-transparent
        disabled:cursor-not-allowed disabled:opacity-40

        ${
          active
            ? "bg-blue-600 text-white shadow-md"
            : "text-slate-600 dark:text-neutral-300 hover:bg-slate-200 dark:hover:bg-[#252834] hover:text-slate-900 dark:hover:text-white disabled:hover:bg-transparent disabled:hover:text-slate-600 dark:disabled:hover:text-neutral-300"
        }
      `}
    >
      {children}
    </button>
  );
}
