import Btn from "../Btn.jsx";
import Card from "../Card.jsx";

export default function TransformPanel({ angle, onRotateLeft, onRotateRight, onFlipX, onFlipY, onStraighten, onAngle }) {
  return (
    <Card>
      <h3 className="mb-3 text-sm font-bold uppercase tracking-[0.12em] text-on-surface-variant">Transform</h3>
      <div className="grid grid-cols-2 gap-2">
        <Btn small variant="secondary" onClick={onRotateLeft} aria-label="Rotate left 90">↺ 90°L</Btn>
        <Btn small variant="secondary" onClick={onRotateRight} aria-label="Rotate right 90">↻ 90°R</Btn>
        <Btn small variant="secondary" onClick={onFlipX} aria-label="Flip horizontal">↔ Flip H</Btn>
        <Btn small variant="secondary" onClick={onFlipY} aria-label="Flip vertical">↕ Flip V</Btn>
      </div>
      <label className="mt-3 block text-xs text-on-surface-variant">
        Straighten {angle}°
        <input type="range" min={-45} max={45} value={angle} onChange={(e) => onStraighten(Number(e.target.value))} aria-label="Straighten" />
      </label>
      <label className="mt-2 block text-xs text-on-surface-variant">
        Custom angle
        <input type="number" value={angle} onChange={(e) => onAngle(Number(e.target.value))} className="mt-1 w-full rounded-lg border border-outline-variant/40 bg-surface-container-lowest px-3 py-2" aria-label="Custom angle" />
      </label>
    </Card>
  );
}
