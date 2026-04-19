export default function LogoBottomBar({ canvasWidth, canvasHeight, objectCount, selectedName, zoom, onOpenHistory }) {
  return (
    <div className="logo-glass flex min-h-10 items-center gap-2 border-t px-3 py-1" style={{ borderColor: "var(--logo-border)", backgroundColor: "rgba(18,19,22,0.92)" }}>
      <span className="rounded-full border px-3 py-1 text-[11px] text-[var(--logo-muted)]" style={{ borderColor: "var(--logo-border)" }}>Canvas {canvasWidth} x {canvasHeight}</span>
      <span className="rounded-full border px-3 py-1 text-[11px] text-[var(--logo-muted)]" style={{ borderColor: "var(--logo-border)" }}>Objects {objectCount}</span>
      <span className="max-w-[320px] truncate rounded-full border px-3 py-1 text-[11px] text-[var(--logo-muted)]" style={{ borderColor: "var(--logo-border)" }}>Selected {selectedName || "None"}</span>
      <span className="ml-auto rounded-full border px-3 py-1 text-[11px] font-semibold text-[var(--logo-text)]" style={{ borderColor: "var(--logo-border)" }}>{Math.round(zoom * 100)}%</span>
      <button type="button" onClick={onOpenHistory} aria-label="Open design history" className="logo-press rounded-full border px-3 py-1 text-[11px] font-semibold text-[var(--logo-text)]" style={{ borderColor: "var(--logo-accent)", backgroundColor: "var(--logo-accent-soft)" }}>
        History
      </button>
    </div>
  );
}
