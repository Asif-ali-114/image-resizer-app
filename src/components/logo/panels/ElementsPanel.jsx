import { useMemo, useState } from "react";
import Btn from "../../Btn.jsx";
import { ICON_CATEGORIES, searchIcons } from "../../../utils/logo/iconLibrary.js";

const SHAPES = [
  "rectangle", "square", "circle", "ellipse", "triangle", "pentagon", "hexagon", "star-5", "star-6", "arrow-right",
  "arrow-left", "arrow-up", "arrow-down", "diamond", "parallelogram", "trapezoid", "cross", "heart", "speech-bubble", "rounded-rectangle",
];

const LINES = ["line", "dashed-line", "dotted-line", "double-line", "arrow-line", "curved-line", "zigzag-line", "wave-line"];

const LIBRARY_SECTIONS = ["Shapes", "Icons", "Illustrations", "Frames", "Stickers", "Charts"];

function CategoryButton({ active, label, onClick }) {
  return (
    <button
      type="button"
      aria-label={`Open ${label} category`}
      onClick={onClick}
      className="logo-press rounded-full border px-3 py-1 text-[11px]"
      style={{
        borderColor: active ? "var(--logo-accent)" : "var(--logo-border)",
        backgroundColor: active ? "var(--logo-accent-soft)" : "rgba(255,255,255,0.02)",
        color: active ? "var(--logo-text)" : "var(--logo-muted)",
      }}
    >
      {label}
    </button>
  );
}

export default function ElementsPanel({ onAddShape, onAddIcon }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [section, setSection] = useState("Shapes");
  const icons = useMemo(() => searchIcons(query, category), [query, category]);
  const filteredShapes = useMemo(() => SHAPES.filter((shape) => shape.includes(query.toLowerCase())), [query]);
  const filteredLines = useMemo(() => LINES.filter((line) => line.includes(query.toLowerCase())), [query]);

  return (
    <div className="space-y-4">
      <h4 className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--logo-muted)]">Elements Library</h4>

      <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
        {LIBRARY_SECTIONS.map((item) => <CategoryButton key={item} label={item} active={section === item} onClick={() => setSection(item)} />)}
      </div>

      <input aria-label="Search elements" value={query} onChange={(e) => setQuery(e.target.value)} placeholder={`Search ${section.toLowerCase()}`} />

      {section === "Shapes" && (
        <>
          <div className="grid grid-cols-3 gap-2">
            {filteredShapes.map((shape) => (
              <button
                key={shape}
                type="button"
                aria-label={`Add ${shape} shape`}
                className="logo-press rounded-xl border p-2 text-[10px] text-[var(--logo-text)]"
                style={{ borderColor: "var(--logo-border)", backgroundColor: "rgba(255,255,255,0.02)" }}
                onClick={() => onAddShape(shape)}
              >
                <div className="mb-2 h-8 rounded-md" style={{ background: "linear-gradient(135deg,#4F8EF7,#6C63FF)" }} />
                {shape.replace(/-/g, " ")}
              </button>
            ))}
          </div>

          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--logo-muted)]">Line Styles</p>
          <div className="grid grid-cols-2 gap-2">
            {filteredLines.map((line) => <Btn key={line} small variant="secondary" onClick={() => onAddShape(line)} aria-label={`Add ${line} line`}>{line.replace(/-/g, " ")}</Btn>)}
          </div>
        </>
      )}

      {section === "Icons" && (
        <>
          <select aria-label="Filter icon categories" value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="All">All</option>
            {ICON_CATEGORIES.map((cat) => <option key={cat} value={cat}>{cat}</option>)}
          </select>
          <div className="grid max-h-60 grid-cols-5 gap-2 overflow-y-auto rounded-xl border p-2" style={{ borderColor: "var(--logo-border)" }}>
            {icons.slice(0, 240).map((icon) => (
              <button
                key={icon.name}
                type="button"
                className="logo-press rounded-lg border p-1 text-[9px] text-[var(--logo-muted)] hover:text-[var(--logo-text)]"
                style={{ borderColor: "var(--logo-border)", backgroundColor: "rgba(255,255,255,0.02)" }}
                title={icon.name}
                aria-label={`Add icon ${icon.name}`}
                onClick={() => onAddIcon(icon)}
              >
                <svg viewBox="0 0 24 24" className="mx-auto mb-1 h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path d={icon.path} />
                </svg>
                {icon.name.slice(0, 8)}
              </button>
            ))}
          </div>
        </>
      )}

      {(section === "Illustrations" || section === "Frames" || section === "Stickers" || section === "Charts") && (
        <div className="grid grid-cols-2 gap-2">
          {Array.from({ length: 8 }, (_, i) => (
            <button
              key={`${section}-${i}`}
              type="button"
              aria-label={`Add ${section} element ${i + 1}`}
              className="logo-press rounded-xl border p-2 text-left"
              style={{ borderColor: "var(--logo-border)", backgroundColor: "rgba(255,255,255,0.02)" }}
              onClick={() => onAddShape(i % 2 ? "rectangle" : "circle")}
            >
              <div className="mb-2 h-16 rounded-lg" style={{ backgroundImage: `linear-gradient(120deg, rgba(79,142,247,0.35), rgba(108,99,255,0.25))` }} />
              <p className="text-xs font-semibold text-[var(--logo-text)]">{section} {i + 1}</p>
              <p className="text-[10px] text-[var(--logo-muted)]">Preview asset</p>
            </button>
          ))}
        </div>
      )}

      {icons.length === 0 && section === "Icons" && (
        <p className="text-xs text-[var(--logo-muted)]">No icons found.</p>
      )}

      {filteredShapes.length === 0 && section === "Shapes" && (
        <p className="text-xs text-[var(--logo-muted)]">No matching shapes.</p>
      )}

      <div className="rounded-xl border p-2" style={{ borderColor: "var(--logo-border)", backgroundColor: "rgba(255,255,255,0.02)" }}>
        <p className="mb-2 text-[10px] uppercase tracking-[0.1em] text-[var(--logo-muted)]">Quick Add</p>
        <div className="grid grid-cols-3 gap-2">
          <Btn small onClick={() => onAddShape("rectangle")} aria-label="Quick add rectangle">Rect</Btn>
          <Btn small onClick={() => onAddShape("circle")} aria-label="Quick add circle">Circle</Btn>
          <Btn small onClick={() => onAddShape("triangle")} aria-label="Quick add triangle">Tri</Btn>
        </div>
      </div>
    </div>
  );
}
