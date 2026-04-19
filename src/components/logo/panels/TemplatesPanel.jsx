import { useMemo, useState } from "react";
import Btn from "../../Btn.jsx";
import { searchTemplates } from "../../../utils/logo/templateData.js";

const CHIP_MAP = {
  "All Templates": "All",
  "Business & Corporate": "Business",
  "Technology & Startup": "Tech",
  "Social Media Post": "Social",
  "Creative & Art": "Playful",
};

const UI_CATEGORIES = ["All", "Business", "Tech", "Social", "Minimal", "Bold", "Playful"];

function templateStyle(template, i) {
  const gradients = [
    ["#1E293B", "#2563EB"],
    ["#111827", "#7C3AED"],
    ["#134E4A", "#0EA5E9"],
    ["#3F3F46", "#F97316"],
    ["#0F172A", "#22C55E"],
    ["#1F2937", "#EC4899"],
  ];
  const pair = gradients[i % gradients.length];
  return {
    backgroundImage: `linear-gradient(140deg, ${pair[0]} 0%, ${pair[1]} 100%)`,
    boxShadow: `inset 0 0 0 1px rgba(255,255,255,0.15)`,
  };
}

function inferUiCategory(template) {
  const mapped = CHIP_MAP[template.category];
  if (mapped) return mapped;
  const hay = `${template.name} ${template.category}`.toLowerCase();
  if (hay.includes("bold")) return "Bold";
  if (hay.includes("minimal")) return "Minimal";
  if (hay.includes("art")) return "Playful";
  return "Minimal";
}

function TemplateThumb({ template, idx }) {
  const cat = inferUiCategory(template);
  return (
    <div className="relative h-24 overflow-hidden rounded-xl p-3" style={templateStyle(template, idx)}>
      <div className="absolute -right-6 -top-6 h-16 w-16 rounded-full bg-white/20 blur-lg" />
      <p className="line-clamp-1 text-[10px] uppercase tracking-[0.12em] text-white/80">{cat}</p>
      <p className="mt-3 line-clamp-2 text-sm font-semibold text-white">{template.name}</p>
      <div className="absolute bottom-2 left-3 right-3 h-[1px] bg-white/30" />
    </div>
  );
}

export default function TemplatesPanel({ onLoadTemplate }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");

  const allItems = useMemo(() => searchTemplates(query, "All Templates"), [query]);
  const items = useMemo(() => {
    return allItems.filter((template) => {
      if (category === "All") return true;
      return inferUiCategory(template) === category;
    });
  }, [allItems, category]);

  const featured = useMemo(() => items.slice(0, 3), [items]);

  return (
    <div className="space-y-4">
      <div>
        <h4 className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--logo-muted)]">Templates</h4>
        <p className="mt-1 text-xs text-[var(--logo-muted)]">Choose from curated layouts and adapt instantly.</p>
      </div>

      <input aria-label="Search templates" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search templates" />

      <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
        {UI_CATEGORIES.map((cat) => (
          <button
            key={cat}
            type="button"
            aria-label={`Filter templates by ${cat}`}
            onClick={() => setCategory(cat)}
            className="logo-press whitespace-nowrap rounded-full border px-3 py-1 text-[11px] font-medium"
            style={{
              borderColor: category === cat ? "var(--logo-accent)" : "var(--logo-border)",
              backgroundColor: category === cat ? "var(--logo-accent-soft)" : "rgba(255,255,255,0.03)",
              color: category === cat ? "var(--logo-text)" : "var(--logo-muted)",
            }}
          >
            {cat}
          </button>
        ))}
      </div>

      <div>
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--logo-muted)]">Featured</p>
        <div className="grid gap-2">
          {featured.map((template, idx) => (
            <button
              key={`featured-${template.id}`}
              type="button"
              aria-label={`Use featured template ${template.name}`}
              onClick={() => onLoadTemplate(template)}
              className="logo-press group rounded-xl border p-2 text-left hover:scale-[1.03]"
              style={{ borderColor: "var(--logo-border)", backgroundColor: "rgba(255,255,255,0.02)" }}
            >
              <TemplateThumb template={template} idx={idx} />
              <div className="mt-2 flex items-center justify-between">
                <span className="line-clamp-1 text-xs font-semibold text-[var(--logo-text)]">{template.name}</span>
                <span className="rounded-full border px-2 py-0.5 text-[10px] text-[var(--logo-muted)]" style={{ borderColor: "var(--logo-border)" }}>{inferUiCategory(template)}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {items.map((template) => (
          <div key={template.id} className="logo-press group relative overflow-hidden rounded-xl border p-2 hover:scale-[1.03]" style={{ borderColor: "var(--logo-border)", backgroundColor: "rgba(255,255,255,0.02)" }}>
            <TemplateThumb template={template} idx={template.name.length} />
            <div className="mt-2 flex items-center justify-between gap-2">
              <p className="line-clamp-1 text-[11px] font-semibold text-[var(--logo-text)]">{template.name}</p>
              <span className="rounded-full border px-2 py-0.5 text-[10px] text-[var(--logo-muted)]" style={{ borderColor: "var(--logo-border)" }}>{inferUiCategory(template)}</span>
            </div>
            <div className="pointer-events-none absolute inset-0 flex items-end justify-center bg-gradient-to-t from-black/70 to-transparent p-2 opacity-0 transition-opacity duration-200 ease-in-out group-hover:opacity-100">
              <Btn small className="pointer-events-auto w-full" onClick={() => onLoadTemplate(template)} aria-label={`Use template ${template.name}`}>Use Template</Btn>
            </div>
          </div>
        ))}
      </div>

      {items.length === 0 && <p className="text-xs text-[var(--logo-muted)]">No templates found for this filter.</p>}
    </div>
  );
}
