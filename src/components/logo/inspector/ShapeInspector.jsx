import { useState } from "react";

function Section({ title, children, initialOpen = true }) {
  const [open, setOpen] = useState(initialOpen);
  return (
    <section className="rounded-xl border" style={{ borderColor: "var(--logo-border)", backgroundColor: "rgba(255,255,255,0.02)" }}>
      <button
        type="button"
        aria-label={`Toggle ${title}`}
        className="flex w-full items-center justify-between px-3 py-2 text-xs font-semibold uppercase tracking-[0.1em] text-[var(--logo-muted)]"
        onClick={() => setOpen((v) => !v)}
      >
        {title}
        <span>{open ? "−" : "+"}</span>
      </button>
      {open && <div className="space-y-3 border-t p-3" style={{ borderColor: "var(--logo-border)" }}>{children}</div>}
    </section>
  );
}

export default function ShapeInspector({ selectedObject, onUpdateSelected, onArrangeSelected }) {
  if (!selectedObject) return null;

  return (
    <div className="space-y-3">
      <Section title="Border" initialOpen>
        <div className="grid grid-cols-2 gap-2">
          <input aria-label="Shape fill color" type="color" value={toHex(selectedObject.fill) || "#4f46e5"} onChange={(e) => onUpdateSelected({ fill: e.target.value })} />
          <input aria-label="Shape stroke color" type="color" value={toHex(selectedObject.stroke) || "#111827"} onChange={(e) => onUpdateSelected({ stroke: e.target.value })} />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <input aria-label="Shape stroke width" type="number" value={Math.round(selectedObject.strokeWidth || 0)} onChange={(e) => onUpdateSelected({ strokeWidth: Number(e.target.value) })} />
          <input aria-label="Shape corner radius" type="number" value={Math.round(selectedObject.rx || 0)} onChange={(e) => onUpdateSelected({ rx: Number(e.target.value), ry: Number(e.target.value) })} />
        </div>
      </Section>

      <Section title="Opacity" initialOpen>
        <label className="text-xs text-[var(--logo-muted)]">Opacity {Math.round((selectedObject.opacity ?? 1) * 100)}%</label>
        <input aria-label="Shape opacity" type="range" min="0" max="100" value={Math.round((selectedObject.opacity ?? 1) * 100)} onChange={(e) => onUpdateSelected({ opacity: Number(e.target.value) / 100 })} />
      </Section>

      <Section title="Effects">
        <label className="text-xs text-[var(--logo-muted)]">Rotation {Math.round(selectedObject.angle || 0)}°</label>
        <input aria-label="Shape rotation" type="range" min="-180" max="180" value={Math.round(selectedObject.angle || 0)} onChange={(e) => onUpdateSelected({ angle: Number(e.target.value) })} />
        <div className="grid grid-cols-2 gap-2">
          <button type="button" aria-label="Bring shape to front" className="logo-press rounded-lg border px-2 py-1 text-xs text-[var(--logo-text)]" style={{ borderColor: "var(--logo-border)" }} onClick={() => onArrangeSelected("front")}>Bring Front</button>
          <button type="button" aria-label="Send shape to back" className="logo-press rounded-lg border px-2 py-1 text-xs text-[var(--logo-text)]" style={{ borderColor: "var(--logo-border)" }} onClick={() => onArrangeSelected("back")}>Send Back</button>
        </div>
      </Section>

      <Section title="Shadow">
        <div className="grid grid-cols-2 gap-2">
          <button type="button" aria-label="Enable subtle shadow" className="logo-press rounded-lg border px-2 py-1 text-xs text-[var(--logo-text)]" style={{ borderColor: "var(--logo-border)" }} onClick={() => onUpdateSelected({ shadow: { color: "rgba(0,0,0,0.3)", blur: 10, offsetX: 2, offsetY: 4 } })}>Soft</button>
          <button type="button" aria-label="Remove shape shadow" className="logo-press rounded-lg border px-2 py-1 text-xs text-[var(--logo-text)]" style={{ borderColor: "var(--logo-border)" }} onClick={() => onUpdateSelected({ shadow: null })}>None</button>
        </div>
      </Section>

      <Section title="Position">
        <div className="grid grid-cols-2 gap-2">
          <input aria-label="Shape position X" type="number" value={Math.round(selectedObject.left || 0)} onChange={(e) => onUpdateSelected({ left: Number(e.target.value) })} />
          <input aria-label="Shape position Y" type="number" value={Math.round(selectedObject.top || 0)} onChange={(e) => onUpdateSelected({ top: Number(e.target.value) })} />
          <input aria-label="Shape width" type="number" value={Math.round((selectedObject.width || 0) * (selectedObject.scaleX || 1))} onChange={(e) => onUpdateSelected({ scaleX: Number(e.target.value) / (selectedObject.width || 1) })} />
          <input aria-label="Shape height" type="number" value={Math.round((selectedObject.height || 0) * (selectedObject.scaleY || 1))} onChange={(e) => onUpdateSelected({ scaleY: Number(e.target.value) / (selectedObject.height || 1) })} />
        </div>
      </Section>
    </div>
  );
}

function toHex(color) {
  if (typeof color !== "string") return null;
  if (color.startsWith("#")) return color;
  return null;
}
