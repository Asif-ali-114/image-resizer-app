import Card from "../Card.jsx";

export default function HistoryPanel({ items }) {
  return (
    <Card>
      <h3 className="mb-3 text-sm font-bold uppercase tracking-[0.12em] text-on-surface-variant">History (last 5)</h3>
      <ul className="space-y-2 text-xs text-on-surface-variant">
        {items.slice(-5).reverse().map((item) => (
          <li key={item.id}>• {item.label}</li>
        ))}
        {items.length === 0 && <li>• No edits yet</li>}
      </ul>
    </Card>
  );
}
