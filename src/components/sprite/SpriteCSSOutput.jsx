import Btn from "../Btn.jsx";
import Card from "../Card.jsx";

export default function SpriteCSSOutput({ cssText, onCopy }) {
  return (
    <Card>
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-sm font-bold uppercase tracking-[0.12em] text-on-surface-variant">CSS Output</h3>
        <Btn small variant="secondary" onClick={onCopy} aria-label="Copy sprite css">Copy CSS</Btn>
      </div>
      <pre className="max-h-52 overflow-auto rounded-lg bg-surface-container-low p-3 text-xs text-on-surface-variant">{cssText || "No CSS yet"}</pre>
    </Card>
  );
}
