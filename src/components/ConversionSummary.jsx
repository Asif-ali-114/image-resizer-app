import Card from "./Card.jsx";

function Stat({ label, value, tone = "default" }) {
  const toneClass = tone === "good"
    ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
    : tone === "warn"
      ? "bg-amber-500/10 text-amber-700 dark:text-amber-300"
      : "bg-surface-container-low text-on-surface";

  return (
    <div className={`rounded-xl border border-outline-variant/30 p-4 ${toneClass}`}>
      <p className="text-[11px] font-bold uppercase tracking-[0.12em]">{label}</p>
      <p className="mt-1 text-xl font-black font-headline">{value}</p>
    </div>
  );
}

export default function ConversionSummary({ filesConverted, mbSaved, avgReduction }) {
  const reductionTone = avgReduction > 2 ? "good" : avgReduction < -2 ? "warn" : "default";

  return (
    <Card>
      <div className="grid gap-3 sm:grid-cols-3">
        <Stat label="Files Converted" value={`✓ ${filesConverted}`} tone="good" />
        <Stat label="Total Change" value={`${mbSaved >= 0 ? "↓" : "↑"} ${Math.abs(mbSaved).toFixed(2)} MB`} tone={mbSaved >= 0 ? "good" : "warn"} />
        <Stat label="Average Size Delta" value={`${avgReduction >= 0 ? "↓" : "↑"} ${Math.abs(avgReduction).toFixed(1)}%`} tone={reductionTone} />
      </div>
    </Card>
  );
}
