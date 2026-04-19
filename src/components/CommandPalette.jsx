import { useEffect, useMemo, useRef, useState } from "react";
import { useTemporaryScrollLock } from "../hooks/useScrollLock.js";

function scoreTool(tool, query) {
  const q = query.trim().toLowerCase();
  if (!q) return 1;
  const hay = `${tool.label} ${tool.description} ${(tool.aliases || []).join(" ")}`.toLowerCase();
  if (hay.includes(q)) return 2;
  const fuzzy = q.split("").every((ch) => hay.includes(ch));
  return fuzzy ? 1 : 0;
}

function ResultItem({ item, active, onSelect }) {
  return (
    <button
      type="button"
      onClick={() => onSelect(item)}
      className={`flex h-14 w-full items-center gap-3 rounded-lg px-4 text-left transition-colors ${active ? "border-l-2 border-l-primary bg-surface-container-low" : "hover:bg-surface-container-low"}`}
    >
      <span className="text-lg" style={{ color: item.color }} aria-hidden="true">{item.icon}</span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium text-on-surface">{item.label}</span>
        <span className="block truncate text-xs text-on-surface-variant">{item.description}</span>
      </span>
      {active && <span className="text-[11px] text-on-surface-variant">↵</span>}
    </button>
  );
}

function SectionLabel({ text }) {
  return <p className="px-4 pb-1 pt-3 text-[11px] uppercase tracking-[0.07em] text-on-surface-variant">{text}</p>;
}

export default function CommandPalette({ open, tools, actions, recentTools = [], onClose, onOpenTool, onRunAction }) {
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef(null);
  const sheetStartRef = useRef(null);

  useTemporaryScrollLock(open);

  const indexed = useMemo(() => tools.filter((tool) => scoreTool(tool, query) > 0), [tools, query]);
  const recent = useMemo(() => recentTools.map((id) => tools.find((tool) => tool.id === id)).filter(Boolean), [recentTools, tools]);
  const visibleRecent = useMemo(() => (query ? [] : recent), [query, recent]);
  const flatItems = useMemo(
    () => [
      ...visibleRecent,
      ...indexed,
      ...actions.map((item) => ({ ...item, kind: "action" })),
    ],
    [visibleRecent, indexed, actions]
  );

  useEffect(() => {
    if (!open) return undefined;
    setActiveIndex(0);
    window.setTimeout(() => inputRef.current?.focus(), 20);

    const onKeyDown = (event) => {
      if (event.key === "ArrowDown") {
        event.preventDefault();
        setActiveIndex((value) => (flatItems.length ? (value + 1) % flatItems.length : 0));
      }
      if (event.key === "ArrowUp") {
        event.preventDefault();
        setActiveIndex((value) => (flatItems.length ? (value - 1 + flatItems.length) % flatItems.length : 0));
      }
      if (event.key === "Enter" && flatItems.length) {
        event.preventDefault();
        const item = flatItems[activeIndex] || flatItems[0];
        if (!item) return;
        if (item.kind === "action") {
          onRunAction(item.id);
        } else {
          onOpenTool(item.id);
        }
        onClose();
      }
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open, flatItems, activeIndex, onClose, onOpenTool, onRunAction]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[140] bg-black/50" onClick={onClose} role="presentation">
      <div
        className="mx-auto mt-[15vh] max-h-[70vh] w-[calc(100%-48px)] max-w-[560px] overflow-y-auto rounded-2xl border border-outline-variant/40 bg-surface shadow-card max-md:mt-auto max-md:h-[92vh] max-md:w-full max-md:max-w-none max-md:rounded-t-2xl max-md:rounded-b-none"
        onClick={(event) => event.stopPropagation()}
        onPointerDown={(event) => {
          if (window.innerWidth >= 640) return;
          sheetStartRef.current = event.clientY;
        }}
        onPointerUp={(event) => {
          if (window.innerWidth >= 640) return;
          if (sheetStartRef.current == null) return;
          if (event.clientY - sheetStartRef.current > 80) onClose();
          sheetStartRef.current = null;
        }}
      >
        <div className="mx-auto mt-2 h-1 w-9 rounded-full bg-outline-variant/60 md:hidden" />

        <div className="sticky top-0 z-10 border-b border-outline-variant/20 bg-surface p-3">
          <div className="flex items-center rounded-xl border border-outline-variant/40 bg-surface-container-low px-3 py-2">
            <span className="mr-2" aria-hidden="true">🔍</span>
            <input
              ref={inputRef}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search tools or type a command..."
              className="w-full bg-transparent text-sm outline-none"
            />
            {query && (
              <button type="button" onClick={() => setQuery("")} aria-label="Clear search" className="text-xs">×</button>
            )}
            <span className="ml-2 rounded-md bg-surface-container px-2 py-0.5 text-[11px] text-on-surface-variant">Esc</span>
          </div>
        </div>

        {visibleRecent.length > 0 && !query && (
          <>
            <SectionLabel text="Recently Used" />
            <div className="px-2">
              {visibleRecent.map((item, idx) => (
                <ResultItem key={`recent-${item.id}`} item={{ ...item, icon: "🕘" } } active={activeIndex === idx} onSelect={() => {
                  onOpenTool(item.id);
                  onClose();
                }} />
              ))}
            </div>
          </>
        )}

        <SectionLabel text="All Tools" />
        <div className="px-2">
          {indexed.map((item, idx) => {
            const shift = visibleRecent.length;
            return (
              <ResultItem
                key={item.id}
                item={item}
                active={activeIndex === idx + shift}
                onSelect={() => {
                  onOpenTool(item.id);
                  onClose();
                }}
              />
            );
          })}
        </div>

        <SectionLabel text="Actions" />
        <div className="px-2 pb-4">
          {actions.map((action, idx) => {
            const shift = visibleRecent.length + indexed.length;
            return (
              <ResultItem
                key={action.id}
                item={{ ...action, kind: "action" }}
                active={activeIndex === shift + idx}
                onSelect={() => {
                  onRunAction(action.id);
                  onClose();
                }}
              />
            );
          })}

          {indexed.length === 0 && query && (
            <p className="rounded-lg border border-outline-variant/30 bg-surface-container-low px-3 py-3 text-sm text-on-surface-variant">
              No tools found for "{query}". Try "resize", "convert", or "pdf".
            </p>
          )}
        </div>

        <div className="border-t border-outline-variant/20 px-4 py-2 text-xs text-on-surface-variant">
          ↑↓ Navigate · ↵ Open · Esc Close
        </div>
      </div>
    </div>
  );
}
