import { useMemo, useState } from "react";
import { FONTS } from "../../../utils/logo/fontList.js";

function Section({ title, children }) {
  const [open, setOpen] = useState(title === "Typography");
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

export default function TextInspector({ selectedObject, onUpdateSelected }) {
  const [query, setQuery] = useState("");
  const fonts = useMemo(() => FONTS.filter((font) => font.name.toLowerCase().includes(query.toLowerCase())), [query]);
  if (!selectedObject) return null;

  return (
    <div className="space-y-3">
      <Section title="Typography">
        <input aria-label="Search font family" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search fonts" />
        <select aria-label="Font family" value={selectedObject.fontFamily || "Inter"} onChange={(e) => onUpdateSelected({ fontFamily: e.target.value })}>
          {fonts.map((font) => <option key={font.name} value={font.name}>{font.name}</option>)}
        </select>
        <div className="grid grid-cols-2 gap-2">
          <input aria-label="Font size" type="number" value={Math.round(selectedObject.fontSize || 32)} onChange={(e) => onUpdateSelected({ fontSize: Number(e.target.value) })} />
          <select aria-label="Font weight" value={selectedObject.fontWeight || "normal"} onChange={(e) => onUpdateSelected({ fontWeight: e.target.value })}>
            <option value="normal">Regular</option>
            <option value="500">Medium</option>
            <option value="600">SemiBold</option>
            <option value="bold">Bold</option>
            <option value="800">ExtraBold</option>
          </select>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <button type="button" aria-label="Toggle italic" className="logo-press rounded-lg border px-2 py-1 text-xs text-[var(--logo-text)]" style={{ borderColor: "var(--logo-border)" }} onClick={() => onUpdateSelected({ fontStyle: selectedObject.fontStyle === "italic" ? "normal" : "italic" })}>Italic</button>
          <button type="button" aria-label="Toggle underline" className="logo-press rounded-lg border px-2 py-1 text-xs text-[var(--logo-text)]" style={{ borderColor: "var(--logo-border)" }} onClick={() => onUpdateSelected({ underline: !selectedObject.underline })}>Underline</button>
        </div>
      </Section>

      <Section title="Effects">
        <label className="text-xs text-[var(--logo-muted)]">Letter spacing</label>
        <input aria-label="Text letter spacing" type="range" min="0" max="1000" value={Math.round(selectedObject.charSpacing || 0)} onChange={(e) => onUpdateSelected({ charSpacing: Number(e.target.value) })} />
        <label className="text-xs text-[var(--logo-muted)]">Line height</label>
        <input aria-label="Text line height" type="range" min="0.8" max="2" step="0.05" value={selectedObject.lineHeight || 1.2} onChange={(e) => onUpdateSelected({ lineHeight: Number(e.target.value) })} />
        <select aria-label="Text alignment" value={selectedObject.textAlign || "left"} onChange={(e) => onUpdateSelected({ textAlign: e.target.value })}>
          <option value="left">Left</option>
          <option value="center">Center</option>
          <option value="right">Right</option>
          <option value="justify">Justify</option>
        </select>
      </Section>

      <Section title="Opacity">
        <label className="text-xs text-[var(--logo-muted)]">Opacity {Math.round((selectedObject.opacity ?? 1) * 100)}%</label>
        <input aria-label="Text opacity" type="range" min="0" max="100" value={Math.round((selectedObject.opacity ?? 1) * 100)} onChange={(e) => onUpdateSelected({ opacity: Number(e.target.value) / 100 })} />
      </Section>

      <Section title="Shadow">
        <div className="grid grid-cols-2 gap-2">
          <button type="button" aria-label="Apply text shadow" className="logo-press rounded-lg border px-2 py-1 text-xs text-[var(--logo-text)]" style={{ borderColor: "var(--logo-border)" }} onClick={() => onUpdateSelected({ shadow: { color: "rgba(0,0,0,0.35)", blur: 8, offsetX: 2, offsetY: 4 } })}>Soft</button>
          <button type="button" aria-label="Remove text shadow" className="logo-press rounded-lg border px-2 py-1 text-xs text-[var(--logo-text)]" style={{ borderColor: "var(--logo-border)" }} onClick={() => onUpdateSelected({ shadow: null })}>None</button>
        </div>
      </Section>

      <Section title="Border">
        <div className="grid grid-cols-2 gap-2">
          <input aria-label="Text fill color" type="color" value={selectedObject.fill || "#ffffff"} onChange={(e) => onUpdateSelected({ fill: e.target.value })} />
          <input aria-label="Text stroke color" type="color" value={selectedObject.stroke || "#111827"} onChange={(e) => onUpdateSelected({ stroke: e.target.value })} />
        </div>
        <input aria-label="Text stroke width" type="number" value={Math.round(selectedObject.strokeWidth || 0)} onChange={(e) => onUpdateSelected({ strokeWidth: Number(e.target.value) })} />
      </Section>
    </div>
  );
}
