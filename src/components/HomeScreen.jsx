import { useState } from "react";
import Card from "./Card.jsx";
import { iconProps } from "./AppIcons.jsx";

function ToolCard({ item, onOpen, isNova }) {
  const handlePointerMove = (event) => {
    if (!isNova) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;
    event.currentTarget.style.setProperty("--spot-x", `${x}%`);
    event.currentTarget.style.setProperty("--spot-y", `${y}%`);
  };

  const handlePointerLeave = (event) => {
    if (!isNova) return;
    event.currentTarget.style.removeProperty("--spot-x");
    event.currentTarget.style.removeProperty("--spot-y");
  };

  return (
    <button
      type="button"
      onClick={() => onOpen(item.id)}
      className={`h-full text-left ${isNova ? "nova-tool-hit" : ""}`}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
    >
      <Card className="neo-tool-card h-full transition-all duration-200 hover:-translate-y-0.5">
        <div className="flex items-center justify-between gap-3">
          <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-[var(--border-default)] bg-[var(--bg-elevated)] text-[var(--accent)] shadow-[var(--shadow-sm)]" aria-hidden="true">
            {item.icon ? <item.icon {...iconProps} /> : null}
          </span>
          <span className="ui-badge">Open</span>
        </div>
        <h3 className="mt-4 text-[16px] font-semibold text-on-surface">{item.label}</h3>
        <p className="mt-2 text-sm text-on-surface-variant">{item.description}</p>
      </Card>
    </button>
  );
}

export default function HomeScreen({ tools, onOpenTool, onFileDrop, onInvalidDrop, uiMode }) {
  const [isDragOver, setIsDragOver] = useState(false);
  const isNova = uiMode === "nova";

  return (
    <section
      className={`content-area mx-auto w-full max-w-[1280px] px-[var(--page-padding)] pb-12 pt-6 ${isDragOver ? "ring-2 ring-inset ring-primary/60" : ""} ${isNova ? "nova-home" : ""}`}
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragOver(true);
      }}
      onDragLeave={(e) => {
        const related = e.relatedTarget;
        if (!related || !e.currentTarget.contains(related)) {
          setIsDragOver(false);
        }
      }}
      onDrop={(e) => {
        e.preventDefault();
        setIsDragOver(false);
        const files = Array.from(e.dataTransfer.files || []).filter((file) => file.type.startsWith("image/"));
        if (!files.length) {
          onInvalidDrop?.();
          return;
        }
        const suggestedTool = files.length === 1 ? "single" : "bulk";
        onFileDrop?.(files, suggestedTool);
      }}
    >
      <div className="neo-hero mb-6 overflow-hidden rounded-2xl border p-6 md:p-8">
        <div className="max-w-[740px]">
          <p className="section-label">Adaptive Creative Workflow</p>
          <h1 className="mt-2 text-3xl font-bold text-on-surface md:text-5xl">Build Better Images With A Workspace That Reacts To You</h1>
          <p className="mt-3 text-sm text-on-surface-variant md:text-base">
            Dynamic actions, gesture-friendly layout, and instant visual feedback designed for high-speed editing.
          </p>
        </div>
      </div>

      <div className="neo-dropzone mb-7 rounded-2xl border border-dashed p-5 text-center md:p-6">
        <p className="text-lg font-semibold text-on-surface">Drop images anywhere to begin</p>
        <p className="mt-1 text-sm text-on-surface-variant">Single file opens Single Resize, multiple files open Bulk Resize.</p>
      </div>

      <div className="mb-5 flex items-center justify-between gap-3 text-sm text-on-surface-variant">
        <span>Fast start: open a tool, drop files, or press Ctrl+K to search.</span>
        <span className="hidden sm:inline">Local-only processing</span>
      </div>

      <div className="grid gap-[var(--section-gap)] sm:grid-cols-2 lg:grid-cols-3">
        {tools.map((item) => (
          <ToolCard key={item.id} item={item} onOpen={onOpenTool} isNova={isNova} />
        ))}
      </div>

      <p className="pt-8 text-center text-sm text-on-surface-variant">Press Ctrl+K to search tools · Local-only processing · Instant Classic/Neo/Nova switch in top bar</p>
    </section>
  );
}
