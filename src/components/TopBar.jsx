import Btn from "./Btn.jsx";
import ThemeToggle from "./ThemeToggle.jsx";
import { iconProps, ToolCommandIcon, ToolHomeIcon, ToolKeyboardIcon, ToolRefreshIcon, ToolSearchIcon } from "./AppIcons.jsx";

export default function TopBar({
  activeTool,
  activeToolLabel,
  onBackHome,
  onOpenPalette,
  onOpenShortcuts,
  uiMode,
  onToggleUiMode,
  onSetUiMode,
}) {
  const modes = [
    { id: "classic", label: "Classic" },
    { id: "neo", label: "Neo" },
    { id: "nova", label: "Nova" },
  ];

  return (
    <header className="top-bar neo-topbar" style={{ height: "var(--navbar-height)" }}>
      <div className="mx-auto flex h-[var(--topbar-height)] w-full max-w-[1280px] items-center gap-3 px-[var(--page-padding)]">
        <div className="flex min-w-[140px] items-center gap-3">
          <span aria-hidden="true" className="neo-logo-mark"><ToolCommandIcon {...iconProps} size={16} /></span>
          <span className="neo-brand text-lg font-semibold">ImageTools</span>
        </div>

        <button
          type="button"
          onClick={onOpenPalette}
          className="hidden h-10 flex-1 items-center justify-between rounded-xl border px-3 text-sm md:flex neo-search"
          aria-label="Search tools or commands"
        >
          <span className="inline-flex items-center gap-2"><ToolSearchIcon {...iconProps} size={16} />Search tools or commands...</span>
          <span className="ui-badge">⌘K</span>
        </button>

        <button
          type="button"
          onClick={onOpenPalette}
          className="inline-flex h-10 w-10 items-center justify-center rounded-xl border md:hidden neo-search"
          aria-label="Open search"
        >
          <ToolSearchIcon {...iconProps} />
        </button>

        <div className="ml-auto flex items-center gap-2">
          <div className="mode-switch" role="tablist" aria-label="Interface mode">
            {modes.map((mode) => (
              <button
                key={mode.id}
                type="button"
                role="tab"
                aria-selected={uiMode === mode.id}
                className={`mode-switch-btn ${uiMode === mode.id ? "is-active" : ""}`}
                onClick={() => onSetUiMode?.(mode.id)}
                title={`Use ${mode.label} interface`}
              >
                {mode.label}
              </button>
            ))}
          </div>
          <Btn small variant="ghost" onClick={onToggleUiMode} aria-label="Cycle UI mode" title="Cycle through Classic, Neo, and Nova">
            <ToolRefreshIcon {...iconProps} />
          </Btn>
          <Btn small variant="secondary" onClick={onOpenShortcuts} aria-label="Open keyboard shortcuts">
            <ToolKeyboardIcon {...iconProps} />
          </Btn>
          <ThemeToggle />
        </div>
      </div>

      {activeTool && (
        <div className="hidden border-t neo-crumb-wrap md:block">
          <div className="mx-auto flex h-10 w-full max-w-[1280px] items-center gap-2 px-[var(--page-padding)] text-[13px] text-[var(--color-text-tertiary)]">
            <button
              type="button"
              onClick={onBackHome}
              className="hover:text-[var(--color-text-primary)]"
            >
              <span className="inline-flex items-center gap-1.5"><ToolHomeIcon {...iconProps} size={15} />All Tools</span>
            </button>
            <span>/</span>
            <span className="text-[var(--color-text-primary)]">{activeToolLabel}</span>
          </div>
        </div>
      )}
    </header>
  );
}
