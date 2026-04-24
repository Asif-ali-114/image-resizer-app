import Card from "../Card.jsx";

export default function HistoryPanel({ items }) {
  return (
    <Card>
      <h3 className="mb-3 text-sm font-bold uppercase tracking-[0.12em] text-on-surface-variant">History</h3>
      <ul className="max-h-48 space-y-1 overflow-y-auto text-xs text-on-surface-variant">
        {items.slice(-10).reverse().map((item, index) => (
          <li key={item.id} className={`flex items-center gap-2 rounded-lg px-2 py-1.5 ${index === 0 ? "bg-primary/15 text-primary" : "hover:bg-surface-container"}`}>
            <span className="w-4 font-mono text-[10px] opacity-70">{items.length - index}</span>
            <span className="truncate">{item.label}</span>
          </li>
        ))}
        {items.length === 0 && <li>• No edits yet</li>}
      </ul>
    </Card>
  );
}
