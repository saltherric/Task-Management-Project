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
            : "text-neutral-300 hover:bg-[#252834] hover:text-white disabled:hover:bg-transparent disabled:hover:text-neutral-300"
        }
      `}
    >
      {children}
    </button>
  );
}
