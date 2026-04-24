import Card from "../Card.jsx";

const FILTERS = ["none", "vivid", "chrome", "fade", "noir", "warm", "cool", "vintage", "sepia", "dramatic"];

export default function FilterPanel({ active, onSelect, thumbByFilter }) {
  return (
    <Card className="editor-control-card">
      <h3 className="mb-3 text-sm font-bold uppercase tracking-[0.12em] text-on-surface-variant">Filters</h3>
      <div className="flex gap-2 overflow-x-auto pb-1.5">
        {FILTERS.map((name) => (
          <button
            key={name}
            type="button"
            onClick={() => onSelect(name)}
            aria-label={`Apply ${name} filter`}
            className={`editor-filter-chip relative flex-shrink-0 overflow-hidden rounded-xl border p-1.5 text-left transition-all ${active === name ? "border-primary shadow-[0_0_0_3px_rgba(79,70,229,0.15)]" : "border-outline-variant/30"}`}
          >
            <div className="h-16 w-24 overflow-hidden rounded-lg bg-surface-container-low">
              {thumbByFilter?.[name]
                ? <img src={thumbByFilter[name]} alt={name} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]" />
                : <div className="h-full w-full animate-pulse bg-gradient-to-br from-surface-container to-surface-container-high" />}
            </div>
            <p className="mt-1.5 text-[11px] font-semibold capitalize text-on-surface">{name}</p>
            {active === name && <span className="absolute right-2 top-2 rounded-full bg-primary px-1.5 text-[10px] font-bold text-on-primary">✓</span>}
          </button>
        ))}
      </div>
    </Card>
  );
}
