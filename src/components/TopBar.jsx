import Btn from "./Btn.jsx";
import ThemeToggle from "./ThemeToggle.jsx";

export default function TopBar({
  activeTool,
  activeToolLabel,
  onBackHome,
  onOpenPalette,
  onOpenShortcuts,
}) {
  return (
    <header className="top-bar" style={{ height: "var(--navbar-height)", borderColor: "var(--color-base-200)", background: "var(--color-base-100)" }}>
      <div className="mx-auto flex h-[var(--topbar-height)] w-full max-w-[1280px] items-center gap-3 px-[var(--page-padding)]">
        <div className="flex min-w-[140px] items-center gap-2">
          <span aria-hidden="true">🖼</span>
          <span className="text-lg font-medium text-[var(--color-text-primary)]">ImageTools</span>
        </div>

        <button
          type="button"
          onClick={onOpenPalette}
          className="hidden h-10 flex-1 items-center justify-between rounded-lg border px-3 text-sm md:flex"
          style={{ borderColor: "var(--color-base-300)", background: "var(--color-base-0)", color: "var(--color-text-tertiary)", boxShadow: "var(--shadow-sm)" }}
          aria-label="Search tools or commands"
        >
          <span>🔍 Search tools or commands...</span>
          <span className="ui-badge">⌘K</span>
        </button>

        <button
          type="button"
          onClick={onOpenPalette}
          className="inline-flex h-10 w-10 items-center justify-center rounded-lg border md:hidden"
          style={{ borderColor: "var(--color-base-300)", background: "var(--color-base-0)", boxShadow: "var(--shadow-sm)" }}
          aria-label="Open search"
        >
          🔍
        </button>

        <div className="ml-auto flex items-center gap-2">
          <Btn small variant="secondary" onClick={onOpenShortcuts} aria-label="Open keyboard shortcuts">
            ⌨
          </Btn>
          <ThemeToggle />
        </div>
      </div>

      {activeTool && (
        <div className="hidden border-t md:block" style={{ borderColor: "var(--color-base-200)" }}>
          <div className="mx-auto flex h-10 w-full max-w-[1280px] items-center gap-2 px-[var(--page-padding)] text-[13px] text-[var(--color-text-tertiary)]">
            <button
              type="button"
              onClick={onBackHome}
              className="hover:text-[var(--color-text-primary)]"
            >
              ← All Tools
            </button>
            <span>/</span>
            <span className="text-[var(--color-text-primary)]">{activeToolLabel}</span>
          </div>
        </div>
      )}
    </header>
  );
}
