import { useState } from "react";
import Btn from "../Btn.jsx";
import Card from "../Card.jsx";
import { iconProps, ToolRefreshIcon, ToolArrowSwapIcon } from "../AppIcons.jsx";

export default function TransformPanel({ angle, onRotateLeft, onRotateRight, onFlipX, onFlipY, onStraighten, onAngle }) {
  const [isStraightenActive, setIsStraightenActive] = useState(false);

  return (
    <Card className="editor-control-card">
      <h3 className="mb-3 text-sm font-bold uppercase tracking-[0.12em] text-on-surface-variant">Transform</h3>
      <div className="grid grid-cols-4 gap-2">
        <Btn small variant="secondary" className="editor-tool-btn" onClick={onRotateLeft} aria-label="Rotate left 90"><ToolRefreshIcon {...iconProps} className="-scale-x-100" /></Btn>
        <Btn small variant="secondary" className="editor-tool-btn" onClick={onRotateRight} aria-label="Rotate right 90"><ToolRefreshIcon {...iconProps} /></Btn>
        <Btn small variant="secondary" className="editor-tool-btn" onClick={onFlipX} aria-label="Flip horizontal"><ToolArrowSwapIcon {...iconProps} /></Btn>
        <Btn small variant="secondary" className="editor-tool-btn" onClick={onFlipY} aria-label="Flip vertical"><ToolArrowSwapIcon {...iconProps} className="rotate-90" /></Btn>
      </div>
      <label className={`editor-slider-group mt-3 block rounded-xl p-2 text-xs text-on-surface-variant ${isStraightenActive ? "is-active" : ""}`}>
        <div className="mb-1 flex items-center justify-between"><span className="text-[12px] font-semibold text-on-surface">Straighten</span><span className="font-mono text-primary">{angle}°</span></div>
        <div className="editor-slider-shell">
          <input
            type="range"
            min={-45}
            max={45}
            value={angle}
            onChange={(e) => onStraighten(Number(e.target.value))}
            onPointerDown={() => setIsStraightenActive(true)}
            onPointerUp={() => setIsStraightenActive(false)}
            onPointerCancel={() => setIsStraightenActive(false)}
            onBlur={() => setIsStraightenActive(false)}
            aria-label="Straighten"
            className={`editor-slider ${isStraightenActive ? "is-active" : ""}`}
            style={{
              "--slider-pct": `${((angle + 45) / 90) * 100}%`,
              "--slider-visual": "linear-gradient(90deg, rgba(251,113,133,.85), rgba(148,163,184,.8), rgba(34,197,94,.85))",
            }}
          />
        </div>
      </label>
      <label className="mt-2 block text-xs text-on-surface-variant">
        <span className="text-[12px] font-semibold text-on-surface">Custom angle</span>
        <input type="number" value={angle} onChange={(e) => onAngle(Number(e.target.value))} className="mt-1 w-full rounded-lg border border-outline-variant/40 bg-surface-container-lowest px-3 py-2 transition-colors duration-150 focus:border-primary/60 focus:outline-none focus:ring-2 focus:ring-primary/20" aria-label="Custom angle" />
      </label>
    </Card>
  );
}
