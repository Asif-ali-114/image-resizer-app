import { useMemo, useState } from "react";
import Btn from "../../Btn.jsx";
import { FONTS } from "../../../utils/logo/fontList.js";

const PRESETS = [
  { id: "modern", label: "Modern Bold", style: { fontFamily: "Montserrat", fontSize: 64, fontWeight: "bold", charSpacing: 200, text: "MODERN BOLD" } },
  { id: "elegant", label: "Elegant Serif", style: { fontFamily: "Playfair Display", fontSize: 56, fontStyle: "italic", text: "Elegant Serif" } },
  { id: "tech", label: "Tech Mono", style: { fontFamily: "Roboto Mono", fontSize: 48, fill: "#00FF88", text: "TECH MONO" } },
  { id: "hand", label: "Handwritten", style: { fontFamily: "Dancing Script", fontSize: 72, text: "Signature" } },
  { id: "outline", label: "Outline Text", style: { fill: "transparent", stroke: "#111827", strokeWidth: 1.5, fontSize: 58, text: "OUTLINE" } },
  { id: "shadow", label: "Shadow Text", style: { fontFamily: "Montserrat", fontSize: 60, text: "SHADOW", shadow: { color: "rgba(0,0,0,0.35)", blur: 6, offsetX: 3, offsetY: 3 } } },
  { id: "gradient", label: "Gradient Text", style: { fontFamily: "Montserrat", fontSize: 54, text: "GRADIENT", useGradient: true } },
  { id: "stamp", label: "Stamp Style", style: { fontFamily: "Roboto Mono", fontSize: 42, fontWeight: "bold", text: "APPROVED" } },
];

export default function TextPanel({ onAddText, onSetTextFont, selectedTextObject }) {
  const [fontQuery, setFontQuery] = useState("");
  const filteredFonts = useMemo(() => FONTS.filter((f) => `${f.name} ${f.category}`.toLowerCase().includes(fontQuery.toLowerCase())), [fontQuery]);

  return (
    <div className="space-y-3">
      <h4 className="text-xs font-semibold uppercase tracking-[0.1em] text-[var(--logo-muted)]">Add Text</h4>
      <Btn className="w-full" onClick={() => onAddText({ text: "Heading", fontSize: 64, fontWeight: "bold" })} aria-label="Add heading text">+ Add Heading</Btn>
      <Btn className="w-full" variant="secondary" onClick={() => onAddText({ text: "Subheading", fontSize: 36 })} aria-label="Add subheading text">+ Add Subheading</Btn>
      <Btn className="w-full" variant="secondary" onClick={() => onAddText({ text: "Body text", fontSize: 20 })} aria-label="Add body text">+ Add Body Text</Btn>

      <h4 className="pt-2 text-xs font-semibold uppercase tracking-[0.1em] text-[var(--logo-muted)]">Fonts</h4>
      <input aria-label="Search text panel fonts" value={fontQuery} onChange={(e) => setFontQuery(e.target.value)} placeholder="Search fonts" />
      <div className="max-h-44 overflow-y-auto rounded-md border" style={{ borderColor: "var(--logo-border)" }}>
        {filteredFonts.slice(0, 120).map((font) => (
          <button key={font.name} type="button" aria-label={`Use ${font.name} font`} className="block w-full border-b px-2 py-1 text-left text-xs hover:bg-white/5" style={{ borderColor: "var(--logo-border)", color: "var(--logo-text)", fontFamily: font.name }} onClick={() => onSetTextFont(font.name)}>
            {font.name}
          </button>
        ))}
      </div>
      {selectedTextObject && <p className="text-[11px] text-[var(--logo-muted)]">Selected text font: {selectedTextObject.fontFamily || "Default"}</p>}

      <h4 className="pt-2 text-xs font-semibold uppercase tracking-[0.1em] text-[var(--logo-muted)]">Text Presets</h4>
      <div className="grid grid-cols-2 gap-2">
        {PRESETS.map((preset) => (
          <button key={preset.id} type="button" aria-label={`Apply ${preset.label} preset`} className="logo-press rounded-md border p-2 text-[10px]" style={{ borderColor: "var(--logo-border)", backgroundColor: "rgba(255,255,255,0.02)", color: "var(--logo-text)" }} onClick={() => onAddText(preset.style)}>
            {preset.label}
          </button>
        ))}
      </div>
    </div>
  );
}
