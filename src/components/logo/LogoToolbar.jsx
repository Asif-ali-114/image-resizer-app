import Btn from "../Btn.jsx";

export default function LogoToolbar({
  onBack,
  undoCount,
  redoCount,
  onUndo,
  onRedo,
  onOpenCanvasSize,
  zoom,
  onZoomChange,
  gridVisible,
  onToggleGrid,
  snapToGrid,
  onToggleSnap,
  preview,
  onTogglePreview,
  onOpenExport,
  onSaveDesign,
  onOpenSaves,
  contextTool,
  onContextToolChange,
}) {
  const zoomPct = `${Math.round(zoom * 100)}%`;
  const contextTools = ["select", "crop", "text", "shape", "draw"];

  return (
    <div className="logo-glass border-b px-3 pb-2 pt-2" style={{ borderColor: "var(--logo-border)", backgroundColor: "rgba(15,15,15,0.95)" }}>
      <div className="mb-2 flex h-12 items-center gap-3">
        <button
          type="button"
          className="logo-press inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-semibold text-[var(--logo-text)]"
          style={{ borderColor: "var(--logo-border)", backgroundColor: "rgba(255,255,255,0.03)" }}
          onClick={onBack}
          aria-label="Back to all tools"
        >
          <span className="text-[var(--logo-accent)]">◈</span>
          Logo Creator
        </button>

        <div className="mx-auto hidden w-[min(560px,50vw)] items-center rounded-xl border px-3 py-2 md:flex" style={{ borderColor: "var(--logo-border)", backgroundColor: "rgba(255,255,255,0.04)" }}>
          <span className="mr-2 text-[var(--logo-muted)]">⌕</span>
          <input
            aria-label="Search tools"
            className="!border-0 !bg-transparent !p-0 text-sm !text-[var(--logo-text)] focus:!ring-0"
            placeholder="Search templates, elements, fonts..."
          />
          <span className="ml-3 rounded-md border px-2 py-0.5 text-[11px] text-[var(--logo-muted)]" style={{ borderColor: "var(--logo-border)" }}>⌘K</span>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <Btn small variant="secondary" onClick={onUndo} disabled={undoCount === 0} aria-label="Undo change">↶ {undoCount}</Btn>
          <Btn small variant="secondary" onClick={onRedo} disabled={redoCount === 0} aria-label="Redo change">↷ {redoCount}</Btn>

          <div className="relative">
            <Btn small onClick={onOpenExport} aria-label="Open export menu">Export ▾</Btn>
          </div>
          <Btn small variant="secondary" onClick={onSaveDesign} aria-label="Share design">Share</Btn>
        </div>
      </div>

      <div className="flex min-h-10 flex-wrap items-center gap-2 rounded-xl border p-2" style={{ borderColor: "var(--logo-border)", backgroundColor: "rgba(255,255,255,0.03)" }}>
        {contextTools.map((toolName) => (
          <button
            key={toolName}
            type="button"
            onClick={() => onContextToolChange?.(toolName)}
            aria-label={`Activate ${toolName} tool`}
            className="logo-press rounded-lg border px-3 py-1.5 text-xs font-medium uppercase tracking-[0.08em]"
            style={{
              borderColor: contextTool === toolName ? "var(--logo-accent)" : "var(--logo-border)",
              color: contextTool === toolName ? "var(--logo-text)" : "var(--logo-muted)",
              backgroundColor: contextTool === toolName ? "var(--logo-accent-soft)" : "rgba(255,255,255,0.02)",
            }}
          >
            {toolName}
          </button>
        ))}

        <div className="ml-auto flex items-center gap-2">
          <Btn small variant="secondary" onClick={onOpenCanvasSize} aria-label="Edit canvas size">Canvas</Btn>
          <select
            aria-label="Canvas zoom"
            className="w-[98px] rounded-lg border px-2 py-1 text-xs"
            style={{ borderColor: "var(--logo-border)", backgroundColor: "rgba(255,255,255,0.02)", color: "var(--logo-text)" }}
            value={zoomPct}
            onChange={(event) => onZoomChange(Number(event.target.value.replace("%", "")) / 100)}
          >
            {["25%", "50%", "75%", "100%", "125%", "150%", "200%"].map((z) => <option key={z} value={z}>{z}</option>)}
          </select>
          <Btn small variant={gridVisible ? "primary" : "secondary"} onClick={onToggleGrid} aria-label="Toggle grid">Grid</Btn>
          <Btn small variant={snapToGrid ? "primary" : "secondary"} onClick={onToggleSnap} aria-label="Toggle snap to grid">Snap</Btn>
          <Btn small variant="secondary" onClick={onOpenSaves} aria-label="Open saved designs">History</Btn>
          <Btn small variant={preview ? "primary" : "secondary"} onClick={onTogglePreview} aria-label="Toggle preview mode">Preview</Btn>
        </div>
      </div>
    </div>
  );
}
