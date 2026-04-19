import { useState } from "react";

function Section({ title, children, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <section className="rounded-xl border" style={{ borderColor: "var(--logo-border)", backgroundColor: "rgba(255,255,255,0.02)" }}>
      <button type="button" aria-label={`Toggle ${title}`} className="flex w-full items-center justify-between px-3 py-2 text-xs font-semibold uppercase tracking-[0.1em] text-[var(--logo-muted)]" onClick={() => setOpen((v) => !v)}>
        {title}
        <span>{open ? "−" : "+"}</span>
      </button>
      {open && <div className="space-y-3 border-t p-3" style={{ borderColor: "var(--logo-border)" }}>{children}</div>}
    </section>
  );
}

export default function ImageInspector({ selectedObject, onUpdateSelected, onArrangeSelected }) {
  if (!selectedObject) return null;

  const blendModes = ["source-over", "multiply", "screen", "overlay", "darken", "lighten", "color-dodge", "color-burn", "hard-light", "soft-light", "difference", "exclusion"];

  return (
    <div className="space-y-3">
      <Section title="Effects" defaultOpen>
        <label className="text-xs text-[var(--logo-muted)]">Blend Mode</label>
        <select aria-label="Image blend mode" value={selectedObject.globalCompositeOperation || "source-over"} onChange={(e) => onUpdateSelected({ globalCompositeOperation: e.target.value })}>
          {blendModes.map((mode) => <option key={mode} value={mode}>{mode}</option>)}
        </select>
        <div className="grid grid-cols-2 gap-2">
          <button type="button" aria-label="Flip image horizontally" className="logo-press rounded-lg border px-2 py-1 text-xs text-[var(--logo-text)]" style={{ borderColor: "var(--logo-border)" }} onClick={() => onUpdateSelected({ flipX: !selectedObject.flipX })}>Flip H</button>
          <button type="button" aria-label="Flip image vertically" className="logo-press rounded-lg border px-2 py-1 text-xs text-[var(--logo-text)]" style={{ borderColor: "var(--logo-border)" }} onClick={() => onUpdateSelected({ flipY: !selectedObject.flipY })}>Flip V</button>
        </div>
      </Section>

      <Section title="Opacity">
        <label className="text-xs text-[var(--logo-muted)]">Opacity {Math.round((selectedObject.opacity ?? 1) * 100)}%</label>
        <input aria-label="Image opacity" type="range" min="0" max="100" value={Math.round((selectedObject.opacity ?? 1) * 100)} onChange={(e) => onUpdateSelected({ opacity: Number(e.target.value) / 100 })} />
      </Section>

      <Section title="Shadow">
        <div className="grid grid-cols-2 gap-2">
          <button type="button" aria-label="Enable image shadow" className="logo-press rounded-lg border px-2 py-1 text-xs text-[var(--logo-text)]" style={{ borderColor: "var(--logo-border)" }} onClick={() => onUpdateSelected({ shadow: { color: "rgba(0,0,0,0.3)", blur: 12, offsetX: 2, offsetY: 6 } })}>Soft</button>
          <button type="button" aria-label="Remove image shadow" className="logo-press rounded-lg border px-2 py-1 text-xs text-[var(--logo-text)]" style={{ borderColor: "var(--logo-border)" }} onClick={() => onUpdateSelected({ shadow: null })}>None</button>
        </div>
      </Section>

      <Section title="Border" defaultOpen={false}>
        <div className="grid grid-cols-2 gap-2">
          <button type="button" aria-label="Bring image to front" className="logo-press rounded-lg border px-2 py-1 text-xs text-[var(--logo-text)]" style={{ borderColor: "var(--logo-border)" }} onClick={() => onArrangeSelected("front")}>Bring Front</button>
          <button type="button" aria-label="Send image to back" className="logo-press rounded-lg border px-2 py-1 text-xs text-[var(--logo-text)]" style={{ borderColor: "var(--logo-border)" }} onClick={() => onArrangeSelected("back")}>Send Back</button>
        </div>
      </Section>
    </div>
  );
}
