import Card from "../Card.jsx";

const FILTERS = ["none", "vivid", "chrome", "fade", "noir", "warm", "cool", "vintage", "sepia", "dramatic"];

export default function FilterPanel({ active, onSelect, thumbByFilter }) {
  return (
    <Card>
      <h3 className="mb-3 text-sm font-bold uppercase tracking-[0.12em] text-on-surface-variant">Filters</h3>
      <div className="grid grid-cols-2 gap-2">
        {FILTERS.map((name) => (
          <button
            key={name}
            type="button"
            onClick={() => onSelect(name)}
            aria-label={`Apply ${name} filter`}
            className={`relative overflow-hidden rounded-lg border p-1 text-left ${active === name ? "border-primary" : "border-outline-variant/30"}`}
          >
            <div className="h-14 w-full overflow-hidden rounded-md bg-surface-container-low">
              {thumbByFilter?.[name] && <img src={thumbByFilter[name]} alt={name} className="h-full w-full object-cover" />}
            </div>
            <p className="mt-1 text-[11px] font-semibold capitalize text-on-surface">{name}</p>
            {active === name && <span className="absolute right-2 top-2 rounded-full bg-primary px-1.5 text-[10px] font-bold text-on-primary">✓</span>}
          </button>
        ))}
      </div>
    </Card>
  );
}
